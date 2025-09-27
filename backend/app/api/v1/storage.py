from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, workspace_access
from app.core.config import settings
from app.models import Project, ProjectStorageConnection, User, Workspace
from app.schemas import (
  StorageBucketListResponse,
  StorageBucketSummary,
  StorageConnectionCreate,
  StorageConnectionListResponse,
  StorageConnectionRead,
  StorageObjectDeleteRequest,
  StorageObjectListResponse,
  StorageObjectSummary,
  StorageSignedUrlRequest,
  StorageSignedUrlResponse,
)
from app.services.gcs import GCSIntegrationError, gcs_service

router = APIRouter(prefix="/workspaces/{workspace_id}/projects/{project_id}/storage")


async def _get_project(
  workspace: Workspace,
  project_id: str,
  db: AsyncSession,
) -> Project:
  project_stmt = select(Project).where(
    and_(
      Project.workspace_id == workspace.id,
      Project.id == project_id,
      Project.is_active.is_(True),
    )
  )
  project_result = await db.execute(project_stmt)
  project = project_result.scalar_one_or_none()
  if not project:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
  return project


async def _ensure_bucket_link(
  project: Project,
  bucket_name: str,
  db: AsyncSession,
) -> ProjectStorageConnection:
  connection_stmt = select(ProjectStorageConnection).where(
    and_(
      ProjectStorageConnection.project_id == project.id,
      ProjectStorageConnection.bucket_name == bucket_name,
    )
  )
  connection_result = await db.execute(connection_stmt)
  connection = connection_result.scalar_one_or_none()
  if not connection:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Bucket is not linked to this project.",
    )
  return connection


@router.get("/connections", response_model=StorageConnectionListResponse)
async def list_storage_connections(
  workspace_id: str,
  project_id: str,
  workspace: Workspace = Depends(workspace_access()),
  db: AsyncSession = Depends(get_db),
) -> StorageConnectionListResponse:
  project = await _get_project(workspace, project_id, db)
  connections_stmt = (
    select(ProjectStorageConnection)
    .where(ProjectStorageConnection.project_id == project.id)
    .order_by(ProjectStorageConnection.created_at.desc())
  )
  result = await db.execute(connections_stmt)
  connections = result.scalars().all()
  payload = [
    StorageConnectionRead.model_validate(connection)
    for connection in connections
  ]
  return StorageConnectionListResponse(connections=payload, total=len(payload))


@router.post(
  "/connections",
  response_model=StorageConnectionRead,
  status_code=status.HTTP_201_CREATED,
)
async def create_storage_connection(
  payload: StorageConnectionCreate,
  workspace_id: str,
  project_id: str,
  workspace: Workspace = Depends(workspace_access("member")),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> StorageConnectionRead:
  project = await _get_project(workspace, project_id, db)

  exists_stmt = select(ProjectStorageConnection).where(
    and_(
      ProjectStorageConnection.project_id == project.id,
      ProjectStorageConnection.bucket_name == payload.bucket_name,
      ProjectStorageConnection.gcp_project_id == payload.gcp_project_id,
      ProjectStorageConnection.prefix == payload.prefix,
    )
  )
  existing = await db.execute(exists_stmt)
  if existing.scalar_one_or_none():
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Bucket and prefix are already linked to this project.",
    )

  connection = ProjectStorageConnection(
    project_id=project.id,
    bucket_name=payload.bucket_name,
    gcp_project_id=payload.gcp_project_id,
    prefix=payload.prefix,
    description=payload.description,
    created_by=current_user.id,
  )
  db.add(connection)
  await db.commit()
  await db.refresh(connection)
  return StorageConnectionRead.model_validate(connection)


@router.delete(
  "/connections/{connection_id}",
  status_code=status.HTTP_200_OK,
)
async def delete_storage_connection(
  workspace_id: str,
  project_id: str,
  connection_id: str = Path(...),
  workspace: Workspace = Depends(workspace_access("member")),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
  project = await _get_project(workspace, project_id, db)
  connection_stmt = select(ProjectStorageConnection).where(
    and_(
      ProjectStorageConnection.project_id == project.id,
      ProjectStorageConnection.id == connection_id,
    )
  )
  connection_result = await db.execute(connection_stmt)
  connection = connection_result.scalar_one_or_none()
  if not connection:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")

  await db.delete(connection)
  await db.commit()
  return {"message": "Storage connection deleted"}


@router.get("/buckets", response_model=StorageBucketListResponse)
async def list_available_buckets(
  workspace_id: str,
  project_id: str,
  gcp_project_id: str | None = Query(None, alias="gcp_project_id"),
  workspace: Workspace = Depends(workspace_access()),
  db: AsyncSession = Depends(get_db),
) -> StorageBucketListResponse:
  await _get_project(workspace, project_id, db)
  try:
    buckets = await gcs_service.list_buckets(project_id=gcp_project_id)
  except GCSIntegrationError as exc:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
  summaries = [StorageBucketSummary(**bucket) for bucket in buckets]
  return StorageBucketListResponse(buckets=summaries, total=len(summaries))


@router.get("/objects", response_model=StorageObjectListResponse)
async def list_objects(
  workspace_id: str,
  project_id: str,
  bucket_name: str = Query(..., alias="bucket"),
  prefix: str | None = Query(None),
  workspace: Workspace = Depends(workspace_access()),
  db: AsyncSession = Depends(get_db),
) -> StorageObjectListResponse:
  project = await _get_project(workspace, project_id, db)
  connection = await _ensure_bucket_link(project, bucket_name, db)

  try:
    listing = await gcs_service.list_objects(
      bucket_name,
      prefix=prefix,
      project_id=connection.gcp_project_id,
    )
  except GCSIntegrationError as exc:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

  files = [StorageObjectSummary(**file_info) for file_info in listing["files"]]
  return StorageObjectListResponse(folders=listing["folders"], files=files)


@router.post("/upload-url", response_model=StorageSignedUrlResponse)
async def create_upload_url(
  payload: StorageSignedUrlRequest,
  workspace_id: str,
  project_id: str,
  workspace: Workspace = Depends(workspace_access("member")),
  db: AsyncSession = Depends(get_db),
) -> StorageSignedUrlResponse:
  project = await _get_project(workspace, project_id, db)
  connection = await _ensure_bucket_link(project, payload.bucket_name, db)

  expires = payload.expires_in
  try:
    url = await gcs_service.generate_upload_url(
      payload.bucket_name,
      payload.object_path,
      expires_in=expires,
      content_type=payload.content_type,
      project_id=connection.gcp_project_id,
    )
  except GCSIntegrationError as exc:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

  ttl = expires or settings.gcs_upload_url_ttl_seconds
  return StorageSignedUrlResponse(url=url, expires_in=ttl)


@router.post("/download-url", response_model=StorageSignedUrlResponse)
async def create_download_url(
  payload: StorageSignedUrlRequest,
  workspace_id: str,
  project_id: str,
  workspace: Workspace = Depends(workspace_access()),
  db: AsyncSession = Depends(get_db),
) -> StorageSignedUrlResponse:
  project = await _get_project(workspace, project_id, db)
  connection = await _ensure_bucket_link(project, payload.bucket_name, db)

  expires = payload.expires_in
  try:
    url = await gcs_service.generate_download_url(
      payload.bucket_name,
      payload.object_path,
      expires_in=expires,
      project_id=connection.gcp_project_id,
    )
  except GCSIntegrationError as exc:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

  ttl = expires or settings.gcs_signed_url_ttl_seconds
  return StorageSignedUrlResponse(url=url, expires_in=ttl)


@router.delete(
  "/objects",
  status_code=status.HTTP_200_OK,
)
async def delete_object(
  payload: StorageObjectDeleteRequest,
  workspace_id: str,
  project_id: str,
  workspace: Workspace = Depends(workspace_access("member")),
  db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
  project = await _get_project(workspace, project_id, db)
  connection = await _ensure_bucket_link(project, payload.bucket_name, db)

  try:
    await gcs_service.delete_object(
      payload.bucket_name,
      payload.object_path,
      project_id=connection.gcp_project_id,
    )
  except GCSIntegrationError as exc:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

  return {"message": "Object deleted"}

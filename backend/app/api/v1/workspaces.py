from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models import Project, User, Workspace, WorkspaceMember
from app.schemas.workspace import (
  WorkspaceCreate,
  WorkspaceCreateResponse,
  WorkspaceDetail,
  WorkspaceJoinRequest,
  WorkspaceJoinResponse,
  WorkspaceListResponse,
  WorkspaceMemberRead,
  WorkspaceRead,
)
from app.utils.invite import generate_invite_code


router = APIRouter()


async def _ensure_unique_invite_code(db: AsyncSession) -> str:
  while True:
    invite_code = generate_invite_code()
    existing = await db.execute(select(Workspace).where(Workspace.invite_code == invite_code))
    if not existing.scalar_one_or_none():
      return invite_code


def _workspace_to_read(workspace: Workspace, member_count: int, role: str) -> WorkspaceRead:
  return WorkspaceRead(
    id=workspace.id,
    name=workspace.name,
    description=workspace.description,
    owner_id=workspace.owner_id,
    invite_code=workspace.invite_code,
    has_access_key=bool(workspace.access_key),
    is_public=workspace.is_public,
    member_count=member_count,
    role=role,
    created_at=workspace.created_at,
  )


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> WorkspaceListResponse:
  owned_result = await db.execute(select(Workspace).where(Workspace.owner_id == current_user.id))
  owned_workspaces = {workspace.id: (workspace, "owner") for workspace in owned_result.scalars()}

  member_stmt = (
    select(Workspace, WorkspaceMember.role)
    .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
    .where(WorkspaceMember.user_id == current_user.id)
  )
  member_results = await db.execute(member_stmt)
  for workspace, role in member_results.all():
    owned_workspaces.setdefault(workspace.id, (workspace, role))

  member_counts_stmt = select(
    WorkspaceMember.workspace_id,
    func.count(WorkspaceMember.id),
  ).group_by(WorkspaceMember.workspace_id)
  member_counts = dict((row[0], row[1]) for row in (await db.execute(member_counts_stmt)).all())

  workspaces = []
  for workspace_id, (workspace, role) in owned_workspaces.items():
    member_count = member_counts.get(workspace_id, 0)
    workspaces.append(_workspace_to_read(workspace, max(member_count, 1), role))

  workspaces.sort(key=lambda item: item.created_at, reverse=True)
  return WorkspaceListResponse(workspaces=workspaces, total=len(workspaces))


@router.post("", response_model=WorkspaceCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
  payload: WorkspaceCreate,
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> WorkspaceCreateResponse:
  name = payload.name.strip()
  if not name:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workspace name is required")

  invite_code = await _ensure_unique_invite_code(db)

  workspace = Workspace(
    name=name,
    description=payload.description,
    owner_id=current_user.id,
    invite_code=invite_code,
    access_key=payload.access_key,
  )
  db.add(workspace)
  await db.flush()

  membership = WorkspaceMember(
    workspace_id=workspace.id,
    user_id=current_user.id,
    role="owner",
  )
  db.add(membership)
  await db.commit()
  await db.refresh(workspace)

  member_count = 1
  workspace_read = _workspace_to_read(workspace, member_count, "owner")

  return WorkspaceCreateResponse(
    workspace=workspace_read,
    invite_code=invite_code,
    access_key=payload.access_key,
  )


@router.post("/join", response_model=WorkspaceJoinResponse)
async def join_workspace(
  payload: WorkspaceJoinRequest,
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> WorkspaceJoinResponse:
  invite_code = payload.invite_code.strip().upper()
  workspace_query = await db.execute(select(Workspace).where(Workspace.invite_code == invite_code))
  workspace = workspace_query.scalar_one_or_none()
  if not workspace:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

  supplied_access_key = payload.access_key.strip() if payload.access_key else None
  if workspace.access_key:
    if not supplied_access_key:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Access key required")
    if supplied_access_key != workspace.access_key:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid access key")

  existing_membership = await db.execute(
    select(WorkspaceMember).where(
      WorkspaceMember.workspace_id == workspace.id,
      WorkspaceMember.user_id == current_user.id,
    )
  )
  membership = existing_membership.scalar_one_or_none()
  message = "Joined workspace"
  if not membership:
    membership = WorkspaceMember(
      workspace_id=workspace.id,
      user_id=current_user.id,
      role="member",
    )
    db.add(membership)
    await db.commit()
    await db.refresh(workspace)
  else:
    await db.refresh(workspace)
    message = "Already a member"

  member_count_query = await db.execute(
    select(func.count(WorkspaceMember.id)).where(WorkspaceMember.workspace_id == workspace.id)
  )
  member_count = member_count_query.scalar_one()

  workspace_read = _workspace_to_read(
    workspace,
    member_count,
    "owner" if workspace.owner_id == current_user.id else membership.role,
  )

  return WorkspaceJoinResponse(workspace=workspace_read, message=message)


@router.get("/{workspace_id}", response_model=WorkspaceDetail)
async def get_workspace_detail(
  workspace_id: str = Path(..., description="Workspace identifier"),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> WorkspaceDetail:
  workspace_query = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
  workspace = workspace_query.scalar_one_or_none()
  if not workspace:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

  if workspace.owner_id != current_user.id:
    membership_query = await db.execute(
      select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id,
      )
    )
    membership = membership_query.scalar_one_or_none()
    if not membership:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

  members_stmt = (
    select(
      WorkspaceMember.user_id,
      WorkspaceMember.role,
      WorkspaceMember.joined_at,
      User.email,
      User.first_name,
      User.last_name,
    )
    .join(User, User.id == WorkspaceMember.user_id)
    .where(WorkspaceMember.workspace_id == workspace_id)
  )
  members_result = await db.execute(members_stmt)
  members: List[WorkspaceMemberRead] = []
  for user_id, role, joined_at, email, first_name, last_name in members_result.all():
    members.append(
      WorkspaceMemberRead(
        user_id=user_id,
        role=role,
        joined_at=joined_at,
        email=email,
        first_name=first_name,
        last_name=last_name,
      )
    )

  projects_count_query = await db.execute(
    select(func.count(Project.id)).where(
      and_(Project.workspace_id == workspace_id, Project.is_active.is_(True))
    )
  )
  project_count = projects_count_query.scalar_one()

  return WorkspaceDetail(
    id=workspace.id,
    name=workspace.name,
    description=workspace.description,
    owner_id=workspace.owner_id,
    invite_code=workspace.invite_code,
    is_public=workspace.is_public,
    members=members,
    project_count=project_count,
    created_at=workspace.created_at,
  )

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, workspace_access
from app.models import Project, User, Workspace
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectRead, ProjectUpdate


router = APIRouter(prefix="/workspaces/{workspace_id}/projects")


def _project_to_read(project: Project, creator: User) -> ProjectRead:
  creator_name = " ".join(filter(None, [creator.first_name, creator.last_name])) or creator.email
  return ProjectRead(
    id=project.id,
    name=project.name,
    description=project.description,
    workspace_id=project.workspace_id,
    created_by=project.created_by,
    creator_name=creator_name,
    project_type=project.project_type,
    tags=project.tags or [],
    created_at=project.created_at,
    updated_at=project.updated_at,
  )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
  workspace_id: str,
  workspace: Workspace = Depends(workspace_access()),
  db: AsyncSession = Depends(get_db),
) -> ProjectListResponse:
  project_stmt = (
    select(Project, User)
    .join(User, User.id == Project.created_by)
    .where(and_(Project.workspace_id == workspace.id, Project.is_active.is_(True)))
    .order_by(Project.created_at.desc())
  )
  result = await db.execute(project_stmt)
  projects = [_project_to_read(project, user) for project, user in result.all()]
  return ProjectListResponse(projects=projects, total=len(projects))


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
  payload: ProjectCreate,
  workspace_id: str,
  workspace: Workspace = Depends(workspace_access("member")),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> ProjectRead:
  project = Project(
    name=payload.name,
    description=payload.description,
    workspace_id=workspace.id,
    created_by=current_user.id,
    project_type=payload.project_type,
    tags=payload.tags or [],
  )
  db.add(project)
  await db.commit()
  await db.refresh(project)
  return _project_to_read(project, current_user)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
  workspace_id: str,
  workspace: Workspace = Depends(workspace_access()),
  project_id: str = Path(...),
  db: AsyncSession = Depends(get_db),
) -> ProjectRead:
  project_stmt = (
    select(Project, User)
    .join(User, User.id == Project.created_by)
    .where(and_(Project.workspace_id == workspace.id, Project.id == project_id, Project.is_active.is_(True)))
  )
  result = await db.execute(project_stmt)
  record = result.one_or_none()
  if not record:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
  project, user = record
  return _project_to_read(project, user)


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
  payload: ProjectUpdate,
  workspace_id: str,
  workspace: Workspace = Depends(workspace_access("member")),
  project_id: str = Path(...),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> ProjectRead:
  project_stmt = select(Project).where(
    and_(Project.workspace_id == workspace.id, Project.id == project_id, Project.is_active.is_(True))
  )
  project_result = await db.execute(project_stmt)
  project = project_result.scalar_one_or_none()
  if not project:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

  if payload.name is not None:
    project.name = payload.name
  if payload.description is not None:
    project.description = payload.description
  if payload.project_type is not None:
    project.project_type = payload.project_type
  if payload.tags is not None:
    project.tags = payload.tags

  await db.commit()
  await db.refresh(project)

  creator_result = await db.execute(select(User).where(User.id == project.created_by))
  creator = creator_result.scalar_one()

  return _project_to_read(project, creator)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
  workspace_id: str,
  workspace: Workspace = Depends(workspace_access("admin")),
  project_id: str = Path(...),
  current_user: User = Depends(get_current_active_user),
  db: AsyncSession = Depends(get_db),
) -> None:
  project_stmt = select(Project).where(
    and_(Project.workspace_id == workspace.id, Project.id == project_id, Project.is_active.is_(True))
  )
  project_result = await db.execute(project_stmt)
  project = project_result.scalar_one_or_none()
  if not project:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

  project.is_active = False
  await db.commit()

  return None

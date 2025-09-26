from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token, hash_token
from app.db.session import get_db_session
from app.models import User, UserSession, Workspace, WorkspaceMember


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_db() -> AsyncSession:
  async for session in get_db_session():
    yield session


async def get_current_user(
  token: Annotated[str, Depends(oauth2_scheme)],
  db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
  if not token:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credentials not provided")

  try:
    payload = decode_access_token(token)
  except ValueError as exc:  # pragma: no cover
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

  user_id: str | None = payload.get("sub")
  session_id: str | None = payload.get("sid")
  if not user_id or not session_id:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

  session_query = await db.execute(
    select(UserSession).where(UserSession.id == session_id)
  )
  session_obj = session_query.scalar_one_or_none()
  if not session_obj:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

  if session_obj.token_hash != hash_token(token):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session mismatch")

  user_query = await db.execute(select(User).where(User.id == user_id))
  user = user_query.scalar_one_or_none()
  if not user or not user.is_active:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

  return user


async def get_current_active_user(
  current_user: Annotated[User, Depends(get_current_user)],
) -> User:
  if not current_user.is_active:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
  return current_user


async def verify_workspace_access(
  workspace_id: str,
  current_user: User,
  db: AsyncSession,
  required_role: str = "member",
) -> Workspace:
  workspace_query = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
  workspace = workspace_query.scalar_one_or_none()
  if not workspace:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

  role_priority = {"member": 1, "admin": 2, "owner": 3}

  if workspace.owner_id == current_user.id:
    return workspace

  membership_query = await db.execute(
    select(WorkspaceMember).where(
      WorkspaceMember.workspace_id == workspace_id,
      WorkspaceMember.user_id == current_user.id,
    )
  )
  membership = membership_query.scalar_one_or_none()
  if not membership:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to workspace")

  if role_priority.get(membership.role, 0) < role_priority.get(required_role, 0):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

  return workspace


def workspace_access(required_role: str = "member"):
  async def _dependency(
    workspace_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
  ) -> Workspace:
    return await verify_workspace_access(
      workspace_id=workspace_id,
      current_user=current_user,
      db=db,
      required_role=required_role,
    )

  return _dependency

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class WorkspaceBase(BaseModel):
  name: str
  description: Optional[str] = None


class WorkspaceCreate(WorkspaceBase):
  access_key: Optional[str] = None
  slug: Optional[str] = None


class WorkspaceUpdate(BaseModel):
  name: Optional[str] = None
  description: Optional[str] = None
  access_key: Optional[str] = None
  slug: Optional[str] = None
  is_public: Optional[bool] = None


class WorkspaceRead(WorkspaceBase):
  id: str
  owner_id: str
  slug: str
  has_access_key: bool
  is_public: bool
  member_count: int
  role: str
  created_at: datetime

  class Config:
    from_attributes = True


class WorkspaceMemberRead(BaseModel):
  user_id: str
  email: str
  first_name: Optional[str]
  last_name: Optional[str]
  role: str
  joined_at: datetime

  class Config:
    from_attributes = True


class WorkspaceDetail(WorkspaceBase):
  id: str
  owner_id: str
  slug: str
  is_public: bool
  members: List[WorkspaceMemberRead]
  project_count: int
  created_at: datetime

  class Config:
    from_attributes = True


class WorkspaceListResponse(BaseModel):
  workspaces: List[WorkspaceRead]
  total: int


class WorkspaceCreateResponse(BaseModel):
  workspace: WorkspaceRead
  access_key: Optional[str] = None


class WorkspaceJoinRequest(BaseModel):
  workspace_id: str
  access_key: Optional[str] = None


class WorkspaceJoinResponse(BaseModel):
  workspace: WorkspaceRead
  message: str


class WorkspaceDeleteResponse(BaseModel):
  message: str

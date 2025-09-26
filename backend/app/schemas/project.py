from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ProjectBase(BaseModel):
  name: str
  description: Optional[str] = None
  project_type: Optional[str] = None
  tags: List[str] = []


class ProjectCreate(ProjectBase):
  pass


class ProjectUpdate(BaseModel):
  name: Optional[str] = None
  description: Optional[str] = None
  project_type: Optional[str] = None
  tags: Optional[List[str]] = None


class ProjectRead(ProjectBase):
  id: str
  workspace_id: str
  created_by: str
  creator_name: str
  created_at: datetime
  updated_at: datetime

  class Config:
    from_attributes = True


class ProjectListResponse(BaseModel):
  projects: List[ProjectRead]
  total: int

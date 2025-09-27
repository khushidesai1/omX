from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class StorageConnectionBase(BaseModel):
  bucket_name: str
  gcp_project_id: Optional[str] = None
  prefix: Optional[str] = None
  description: Optional[str] = None


class StorageConnectionCreate(StorageConnectionBase):
  pass


class StorageConnectionRead(StorageConnectionBase):
  id: str
  project_id: str
  created_by: str
  created_at: datetime
  updated_at: datetime

  class Config:
    from_attributes = True


class StorageConnectionListResponse(BaseModel):
  connections: List[StorageConnectionRead]
  total: int


class StorageBucketSummary(BaseModel):
  name: str
  location: Optional[str] = None
  storage_class: Optional[str] = None


class StorageBucketListResponse(BaseModel):
  buckets: List[StorageBucketSummary]
  total: int


class StorageObjectSummary(BaseModel):
  name: str
  size: Optional[int] = None
  updated_at: Optional[datetime] = None
  content_type: Optional[str] = None
  storage_class: Optional[str] = None


class StorageObjectListResponse(BaseModel):
  folders: List[str]
  files: List[StorageObjectSummary]


class StorageObjectListRequest(BaseModel):
  bucket_name: str
  prefix: Optional[str] = None


class StorageSignedUrlRequest(BaseModel):
  bucket_name: str
  object_path: str
  content_type: Optional[str] = None
  expires_in: Optional[int] = None


class StorageSignedUrlResponse(BaseModel):
  url: str
  expires_in: int


class StorageObjectDeleteRequest(BaseModel):
  bucket_name: str
  object_path: str

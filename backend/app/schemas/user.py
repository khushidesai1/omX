from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
  email: EmailStr
  first_name: Optional[str] = None
  last_name: Optional[str] = None


class UserCreate(UserBase):
  password: str


class UserRead(UserBase):
  id: str
  created_at: datetime

  class Config:
    from_attributes = True


class UserLogin(BaseModel):
  email: EmailStr
  password: str


class EmailCheckRequest(BaseModel):
  email: EmailStr


class EmailEligibilityResponse(BaseModel):
  email: EmailStr
  eligible: bool


class AccessRequest(BaseModel):
  email: EmailStr


class MessageResponse(BaseModel):
  message: str

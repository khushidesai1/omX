from datetime import datetime

from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserRead


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  expires_in: int
  user: UserRead


class LogoutResponse(BaseModel):
  message: str
  timestamp: datetime


class GoogleAuthStatus(BaseModel):
  connected: bool
  google_email: Optional[str] = None
  expires_at: Optional[datetime] = None


class GoogleRefreshResponse(BaseModel):
  access_token: str
  expires_in: int
  token_type: str = "Bearer"

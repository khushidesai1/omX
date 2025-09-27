from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

  api_v1_prefix: str = Field(default="/api")
  project_name: str = Field(default="omX Backend")

  database_url: str = Field(default="sqlite+aiosqlite:///./omx_dev.db", alias="DATABASE_URL")

  secret_key: str = Field(default="changeme-super-secret", alias="SECRET_KEY")
  algorithm: str = Field(default="HS256", alias="ALGORITHM")
  access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

  cors_origins: List[AnyHttpUrl] = Field(default_factory=lambda: ["http://localhost:5173"])
  cors_origin_regex: Optional[str] = Field(default=None, alias="CORS_ORIGIN_REGEX")
  sendgrid_api_key: Optional[str] = Field(default=None, alias="SENDGRID_API_KEY")
  access_request_recipient: EmailStr = Field(default="khushi.desai@columbia.edu", alias="ACCESS_REQUEST_EMAIL")
  access_request_sender: Optional[EmailStr] = Field(default=None, alias="ACCESS_REQUEST_SENDER")


@lru_cache
def get_settings() -> Settings:
  return Settings()  # type: ignore[arg-type]


settings = get_settings()

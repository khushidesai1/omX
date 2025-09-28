from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, EmailStr, Field, field_validator
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

  gcs_project_id: Optional[str] = Field(default=None, alias="GCS_PROJECT_ID")
  gcs_credentials_path: Optional[str] = Field(default=None, alias="GCS_CREDENTIALS_PATH")
  gcs_signed_url_ttl_seconds: int = Field(default=900, alias="GCS_SIGNED_URL_TTL_SECONDS")
  gcs_upload_url_ttl_seconds: int = Field(default=900, alias="GCS_UPLOAD_URL_TTL_SECONDS")

  # Google OAuth Configuration
  google_oauth_client_id: Optional[str] = Field(default=None, alias="GOOGLE_OAUTH_CLIENT_ID")
  google_oauth_client_secret: Optional[str] = Field(default=None, alias="GOOGLE_OAUTH_CLIENT_SECRET")
  google_oauth_redirect_uri: str = Field(default="http://localhost:8000/api/auth/google/callback", alias="GOOGLE_OAUTH_REDIRECT_URI")

  # omX Service Account Configuration
  omx_service_account_email: Optional[str] = Field(default=None, alias="OMX_SERVICE_ACCOUNT_EMAIL")
  omx_service_account_key_path: Optional[str] = Field(default=None, alias="OMX_SERVICE_ACCOUNT_KEY_PATH")

  @field_validator("cors_origins", mode="before")
  @classmethod
  def _split_cors_origins(cls, value: AnyHttpUrl | str | List[AnyHttpUrl]) -> List[AnyHttpUrl] | str:
    if isinstance(value, str):
      cleaned = [origin.strip() for origin in value.split(",") if origin.strip()]
      return cleaned or value
    return value


@lru_cache
def get_settings() -> Settings:
  return Settings()  # type: ignore[arg-type]


settings = get_settings()

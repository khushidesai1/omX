from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
  return password_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
  return password_context.hash(password)


def _now_utc() -> datetime:
  return datetime.now(timezone.utc)


def create_access_token(subject: str, session_id: str, expires_delta: Optional[timedelta] = None) -> tuple[str, datetime]:
  to_encode: dict[str, Any] = {"sub": subject, "sid": session_id}
  expire = _now_utc() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
  to_encode.update({"exp": expire})
  token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
  return token, expire


def decode_access_token(token: str) -> dict[str, Any]:
  try:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
  except JWTError as exc:  # pragma: no cover - rethrow for consistent handling
    raise ValueError("Invalid token") from exc


def hash_token(token: str) -> str:
  return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session_identifier() -> str:
  return secrets.token_hex(16)

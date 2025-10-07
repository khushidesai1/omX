"""Helpers for persisting Google OAuth credentials."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UserGoogleCredential
from app.utils.crypto import decrypt_string, encrypt_string


def _now() -> datetime:
  return datetime.now(timezone.utc)


async def get_credentials(db: AsyncSession, user_id: str) -> UserGoogleCredential | None:
  result = await db.execute(
    select(UserGoogleCredential).where(UserGoogleCredential.user_id == user_id)
  )
  return result.scalar_one_or_none()


async def upsert_credentials(
  db: AsyncSession,
  *,
  user_id: str,
  google_email: str | None,
  access_token: str | None,
  refresh_token: str | None,
  expires_in: int | None,
  scopes: Iterable[str] | None,
) -> UserGoogleCredential:
  record = await get_credentials(db, user_id)
  expires_at = None
  if expires_in is not None:
    expires_at = _now() + timedelta(seconds=expires_in)

  if record is None:
    record = UserGoogleCredential(
      user_id=user_id,
      google_email=google_email,
      scopes=" ".join(scopes) if scopes else None,
      access_token_encrypted=encrypt_string(access_token),
      refresh_token_encrypted=encrypt_string(refresh_token),
      access_token_expires_at=expires_at,
    )
    db.add(record)
  else:
    record.google_email = google_email or record.google_email
    if scopes:
      record.scopes = " ".join(scopes)
    if access_token is not None:
      record.access_token_encrypted = encrypt_string(access_token)
    if refresh_token is not None:
      record.refresh_token_encrypted = encrypt_string(refresh_token)
    record.access_token_expires_at = expires_at

  await db.flush()
  return record


async def delete_credentials(db: AsyncSession, user_id: str) -> None:
  record = await get_credentials(db, user_id)
  if record is not None:
    await db.delete(record)
    await db.flush()


def get_decrypted_access_token(record: UserGoogleCredential) -> str | None:
  return decrypt_string(record.access_token_encrypted)


def get_decrypted_refresh_token(record: UserGoogleCredential) -> str | None:
  return decrypt_string(record.refresh_token_encrypted)


__all__ = [
  "get_credentials",
  "upsert_credentials",
  "delete_credentials",
  "get_decrypted_access_token",
  "get_decrypted_refresh_token",
]

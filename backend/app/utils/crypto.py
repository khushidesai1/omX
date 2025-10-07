"""Simple helpers for encrypting and decrypting sensitive strings."""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _derive_key() -> bytes:
  """Derive a 32-byte key from the application's secret key."""
  digest = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
  return base64.urlsafe_b64encode(digest)


def _get_cipher() -> Fernet:
  return Fernet(_derive_key())


def encrypt_string(value: str | None) -> str | None:
  if value is None:
    return None
  cipher = _get_cipher()
  token = cipher.encrypt(value.encode("utf-8"))
  return token.decode("utf-8")


def decrypt_string(value: str | None) -> str | None:
  if value is None:
    return None
  cipher = _get_cipher()
  try:
    plaintext = cipher.decrypt(value.encode("utf-8"))
    return plaintext.decode("utf-8")
  except InvalidToken as exc:  # pragma: no cover - indicates corrupted data
    raise ValueError("Failed to decrypt value") from exc


__all__ = ["encrypt_string", "decrypt_string"]

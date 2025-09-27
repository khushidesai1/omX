"""Google Cloud Storage integration helpers."""

from __future__ import annotations

import asyncio
from datetime import timedelta
from functools import lru_cache
from typing import Any, Dict, List, Optional

from google.api_core.exceptions import NotFound
from google.cloud import storage
from google.oauth2 import service_account

from app.core.config import settings


class GCSIntegrationError(RuntimeError):
  """Raised when the GCS service cannot fulfill a request."""


def _load_credentials() -> Optional[service_account.Credentials]:
  if not settings.gcs_credentials_path:
    return None
  return service_account.Credentials.from_service_account_file(settings.gcs_credentials_path)


@lru_cache
def _get_client(project_id: Optional[str]) -> storage.Client:
  credentials = _load_credentials()
  target_project = project_id or settings.gcs_project_id
  if credentials:
    if target_project:
      return storage.Client(project=target_project, credentials=credentials)
    return storage.Client(credentials=credentials)
  if target_project:
    return storage.Client(project=target_project)
  return storage.Client()


def _ensure_prefix(prefix: Optional[str], delimiter: str) -> str:
  if not prefix:
    return ""
  normalized = prefix if prefix.endswith(delimiter) else f"{prefix}{delimiter}"
  if normalized.startswith(delimiter):
    return normalized[len(delimiter) :]
  return normalized


class GCSService:
  """Thin async-friendly wrapper around the synchronous storage client."""

  async def list_objects(
    self,
    bucket_name: str,
    *,
    prefix: Optional[str] = None,
    delimiter: str = "/",
    project_id: Optional[str] = None,
  ) -> Dict[str, List[Dict[str, Any]]]:
    prepared_prefix = _ensure_prefix(prefix, delimiter)

    def _inner() -> Dict[str, List[Dict[str, Any]]]:
      client = _get_client(project_id)
      iterator = client.list_blobs(bucket_name, prefix=prepared_prefix or None, delimiter=delimiter)
      files: List[Dict[str, Any]] = []
      for blob in iterator:
        files.append(
          {
            "name": blob.name,
            "size": blob.size,
            "updated_at": blob.updated,
            "content_type": blob.content_type,
            "storage_class": blob.storage_class,
          }
        )

      folders = sorted(iterator.prefixes) if hasattr(iterator, "prefixes") else []
      return {"files": files, "folders": folders}

    return await asyncio.to_thread(_inner)

  async def list_buckets(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    def _inner() -> List[Dict[str, Any]]:
      client = _get_client(project_id)
      buckets = []
      iterator = client.list_buckets(project=project_id or client.project)
      for bucket in iterator:
        buckets.append(
          {
            "name": bucket.name,
            "location": bucket.location,
            "storage_class": bucket.storage_class,
          }
        )
      return buckets

    return await asyncio.to_thread(_inner)

  async def generate_download_url(
    self,
    bucket_name: str,
    object_path: str,
    *,
    expires_in: Optional[int] = None,
    response_disposition: Optional[str] = None,
    project_id: Optional[str] = None,
  ) -> str:
    ttl = expires_in or settings.gcs_signed_url_ttl_seconds

    def _inner() -> str:
      client = _get_client(project_id)
      blob = client.bucket(bucket_name).blob(object_path)
      if not blob.exists():
        raise GCSIntegrationError(f"Object '{object_path}' not found in bucket '{bucket_name}'.")
      return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(seconds=ttl),
        method="GET",
        response_disposition=response_disposition,
      )

    return await asyncio.to_thread(_inner)

  async def generate_upload_url(
    self,
    bucket_name: str,
    object_path: str,
    *,
    expires_in: Optional[int] = None,
    content_type: Optional[str] = None,
    project_id: Optional[str] = None,
  ) -> str:
    ttl = expires_in or settings.gcs_upload_url_ttl_seconds

    def _inner() -> str:
      client = _get_client(project_id)
      blob = client.bucket(bucket_name).blob(object_path)
      return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(seconds=ttl),
        method="PUT",
        content_type=content_type,
      )

    return await asyncio.to_thread(_inner)

  async def delete_object(self, bucket_name: str, object_path: str, *, project_id: Optional[str] = None) -> None:
    def _inner() -> None:
      client = _get_client(project_id)
      blob = client.bucket(bucket_name).blob(object_path)
      try:
        blob.delete()
      except NotFound as exc:  # pragma: no cover - passthrough for clarity
        raise GCSIntegrationError(
          f"Object '{object_path}' not found in bucket '{bucket_name}'."
        ) from exc

    await asyncio.to_thread(_inner)


gcs_service = GCSService()

__all__ = ["gcs_service", "GCSIntegrationError"]

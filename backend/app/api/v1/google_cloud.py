"""API endpoints for Google Cloud Platform integration."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models import User
from app.services.google_credentials import (
  get_credentials,
  get_decrypted_access_token,
  get_decrypted_refresh_token,
  upsert_credentials,
)
from app.services.google_cloud import GoogleCloudError, google_cloud_service
from app.services.google_oauth import GoogleOAuthError, google_oauth_service

router = APIRouter()


async def _resolve_tokens(
  *,
  access_token: Optional[str],
  refresh_token: Optional[str],
  current_user: User,
  db: AsyncSession,
) -> tuple[str, Optional[str]]:
  if access_token:
    return access_token, refresh_token

  record = await get_credentials(db, current_user.id)
  if not record:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account not connected")

  token = get_decrypted_access_token(record)
  refresh = refresh_token or get_decrypted_refresh_token(record)

  expires_at = record.access_token_expires_at
  token_expired = True
  if token:
    if expires_at is None:
      token_expired = False
    else:
      token_expired = expires_at <= datetime.now(timezone.utc) + timedelta(seconds=60)

  if token_expired:
    if not refresh:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stored Google token expired and no refresh token available")
    try:
      token_data = await google_oauth_service.refresh_access_token(refresh)
    except GoogleOAuthError as exc:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to refresh Google token: {str(exc)}") from exc

    token = token_data.get("access_token")
    if not token:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google did not return an access token")

    new_refresh = token_data.get("refresh_token") or refresh
    await upsert_credentials(
      db,
      user_id=current_user.id,
      google_email=record.google_email,
      access_token=token,
      refresh_token=new_refresh,
      expires_in=token_data.get("expires_in"),
      scopes=None,
    )
    await db.commit()
    refresh = new_refresh

  return token, refresh


@router.get("/projects")
async def list_user_projects(
    access_token: Optional[str] = Query(None, description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, str]]]:
    """
    List all Google Cloud projects accessible to the authenticated user.

    Requires the user to have a valid Google OAuth access token.
    """
    try:
        resolved_access_token, resolved_refresh_token = await _resolve_tokens(
            access_token=access_token,
            refresh_token=refresh_token,
            current_user=current_user,
            db=db,
        )
        projects = await google_cloud_service.list_accessible_projects(
            access_token=resolved_access_token,
            refresh_token=resolved_refresh_token,
        )

        return {
            "projects": projects,
            "total": len(projects)
        }

    except GoogleCloudError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list projects: {str(e)}"
        ) from e
    except Exception as e:  # pragma: no cover - unexpected runtime errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@router.get("/projects/{project_id}/buckets")
async def list_project_buckets(
    project_id: str,
    access_token: Optional[str] = Query(None, description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, str]]]:
    """
    List all storage buckets in a specific Google Cloud project.

    Requires the user to have access to the specified project.
    """
    try:
        resolved_access_token, resolved_refresh_token = await _resolve_tokens(
            access_token=access_token,
            refresh_token=refresh_token,
            current_user=current_user,
            db=db,
        )
        buckets = await google_cloud_service.list_storage_buckets_for_project(
            project_id=project_id,
            access_token=resolved_access_token,
            refresh_token=resolved_refresh_token,
        )

        return {
            "buckets": buckets,
            "project_id": project_id,
            "total": len(buckets)
        }

    except GoogleCloudError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list buckets for project {project_id}: {str(e)}"
        ) from e
    except Exception as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@router.post("/projects/{project_id}/buckets/{bucket_name}/verify-access")
async def verify_bucket_access(
    project_id: str,
    bucket_name: str,
    access_token: Optional[str] = Query(None, description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, bool]:
    """
    Verify that the user has access to a specific storage bucket.

    Returns whether the user can access the bucket and if omX service account has permissions.
    """
    try:
        resolved_access_token, resolved_refresh_token = await _resolve_tokens(
            access_token=access_token,
            refresh_token=refresh_token,
            current_user=current_user,
            db=db,
        )

        user_has_access = await google_cloud_service.verify_bucket_access(
            project_id=project_id,
            bucket_name=bucket_name,
            access_token=resolved_access_token,
            refresh_token=resolved_refresh_token,
        )

        service_account_has_access = False
        if hasattr(google_cloud_service, '_service_account_credentials') and google_cloud_service._service_account_credentials:
            service_account_email = google_cloud_service._service_account_credentials.service_account_email
            service_account_has_access = await google_cloud_service.check_service_account_access(
                project_id=project_id,
                service_account_email=service_account_email,
                access_token=resolved_access_token,
                refresh_token=resolved_refresh_token,
            )

        return {
            "user_has_access": user_has_access,
            "service_account_has_access": service_account_has_access,
            "project_id": project_id,
            "bucket_name": bucket_name
        }

    except GoogleCloudError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to verify access to bucket {bucket_name}: {str(e)}"
        ) from e
    except Exception as e:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@router.get("/projects/{project_id}/iam-policy")
async def get_project_iam_policy(
    project_id: str,
    access_token: str = Query(..., description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get the IAM policy for a project to check permissions.

    This endpoint allows checking what service accounts and users have access to the project.
    """
    try:
        policy = await google_cloud_service.get_project_iam_policy(
            project_id=project_id,
            access_token=access_token,
            refresh_token=refresh_token
        )

        return {
            "project_id": project_id,
            "iam_policy": policy
        }

    except GoogleCloudError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get IAM policy for project {project_id}: {str(e)}"
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e

"""API endpoints for Google Cloud Platform integration."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models import User
from app.services.google_cloud import GoogleCloudError, google_cloud_service

router = APIRouter()


@router.get("/projects")
async def list_user_projects(
    access_token: str = Query(..., description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, str]]]:
    """
    List all Google Cloud projects accessible to the authenticated user.

    Requires the user to have a valid Google OAuth access token.
    """
    try:
        projects = await google_cloud_service.list_accessible_projects(
            access_token=access_token,
            refresh_token=refresh_token
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@router.get("/projects/{project_id}/buckets")
async def list_project_buckets(
    project_id: str,
    access_token: str = Query(..., description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, str]]]:
    """
    List all storage buckets in a specific Google Cloud project.

    Requires the user to have access to the specified project.
    """
    try:
        buckets = await google_cloud_service.list_storage_buckets_for_project(
            project_id=project_id,
            access_token=access_token,
            refresh_token=refresh_token
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) from e


@router.post("/projects/{project_id}/buckets/{bucket_name}/verify-access")
async def verify_bucket_access(
    project_id: str,
    bucket_name: str,
    access_token: str = Query(..., description="User's Google OAuth access token"),
    refresh_token: Optional[str] = Query(None, description="User's Google OAuth refresh token"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, bool]:
    """
    Verify that the user has access to a specific storage bucket.

    Returns whether the user can access the bucket and if omX service account has permissions.
    """
    try:
        # Check user access to bucket
        user_has_access = await google_cloud_service.verify_bucket_access(
            project_id=project_id,
            bucket_name=bucket_name,
            access_token=access_token,
            refresh_token=refresh_token
        )

        # Check if omX service account has access (if configured)
        service_account_has_access = False
        if hasattr(google_cloud_service, '_service_account_credentials') and google_cloud_service._service_account_credentials:
            service_account_email = google_cloud_service._service_account_credentials.service_account_email
            service_account_has_access = await google_cloud_service.check_service_account_access(
                project_id=project_id,
                service_account_email=service_account_email,
                access_token=access_token,
                refresh_token=refresh_token
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
    except Exception as e:
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

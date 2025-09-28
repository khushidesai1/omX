"""Google Cloud Platform API integration for listing projects and resources."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from google.auth.credentials import Credentials
from google.cloud import resourcemanager_v1
from google.cloud import storage
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials as OAuth2Credentials

from app.core.config import settings


class GoogleCloudError(Exception):
    """Raised when Google Cloud API operations fail."""


class GoogleCloudService:
    """Service for interacting with Google Cloud APIs using user OAuth tokens."""

    def __init__(self):
        self._service_account_credentials = self._load_service_account_credentials()

    def _load_service_account_credentials(self) -> Optional[service_account.Credentials]:
        """Load omX service account credentials for impersonation."""

        # Try base64-encoded key first (for Render deployment)
        if settings.omx_service_account_key_base64:
            try:
                import base64
                import json
                key_data = base64.b64decode(settings.omx_service_account_key_base64)
                key_info = json.loads(key_data)
                return service_account.Credentials.from_service_account_info(
                    key_info,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
            except Exception as e:
                print(f"Failed to load base64 service account key: {e}")

        # Fall back to file path (for local development)
        if settings.omx_service_account_key_path:
            try:
                return service_account.Credentials.from_service_account_file(
                    settings.omx_service_account_key_path,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
            except Exception as e:
                print(f"Failed to load service account key from file: {e}")

        return None

    def _create_user_credentials(self, access_token: str, refresh_token: Optional[str] = None) -> OAuth2Credentials:
        """Create OAuth2 credentials from user tokens."""
        return OAuth2Credentials(
            token=access_token,
            refresh_token=refresh_token,
            client_id=settings.google_oauth_client_id,
            client_secret=settings.google_oauth_client_secret,
            token_uri="https://oauth2.googleapis.com/token",
        )

    async def list_accessible_projects(
        self,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List all projects accessible to the authenticated user.

        Args:
            access_token: User's OAuth access token
            refresh_token: User's OAuth refresh token (optional)

        Returns:
            List of project dictionaries with id, name, and state
        """
        def _inner() -> List[Dict[str, Any]]:
            credentials = self._create_user_credentials(access_token, refresh_token)

            # Create Resource Manager client with user credentials
            client = resourcemanager_v1.ProjectsClient(credentials=credentials)

            projects = []
            try:
                # List all projects accessible to the user
                request = resourcemanager_v1.ListProjectsRequest()
                page_result = client.list_projects(request=request)

                for project in page_result:
                    # Only include active projects
                    if project.state == resourcemanager_v1.Project.State.ACTIVE:
                        projects.append({
                            "id": project.project_id,
                            "name": project.display_name or project.project_id,
                            "number": project.name.split("/")[-1] if project.name else None,
                            "state": project.state.name,
                            "labels": dict(project.labels) if project.labels else {},
                        })

            except Exception as e:
                raise GoogleCloudError(f"Failed to list projects: {str(e)}") from e

            return projects

        return await asyncio.to_thread(_inner)

    async def list_storage_buckets_for_project(
        self,
        project_id: str,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List all storage buckets in a specific project accessible to the user.

        Args:
            project_id: GCP project ID
            access_token: User's OAuth access token
            refresh_token: User's OAuth refresh token (optional)

        Returns:
            List of bucket dictionaries with name, location, and storage class
        """
        def _inner() -> List[Dict[str, Any]]:
            credentials = self._create_user_credentials(access_token, refresh_token)

            # Create Storage client with user credentials
            client = storage.Client(project=project_id, credentials=credentials)

            buckets = []
            try:
                # List all buckets in the project
                for bucket in client.list_buckets():
                    buckets.append({
                        "name": bucket.name,
                        "location": bucket.location,
                        "storage_class": bucket.storage_class,
                        "created": bucket.time_created.isoformat() if bucket.time_created else None,
                        "metageneration": bucket.metageneration,
                        "versioning_enabled": bucket.versioning_enabled,
                    })

            except Exception as e:
                raise GoogleCloudError(f"Failed to list buckets for project {project_id}: {str(e)}") from e

            return buckets

        return await asyncio.to_thread(_inner)

    async def verify_bucket_access(
        self,
        project_id: str,
        bucket_name: str,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> bool:
        """
        Verify that the user has access to a specific bucket.

        Args:
            project_id: GCP project ID
            bucket_name: Storage bucket name
            access_token: User's OAuth access token
            refresh_token: User's OAuth refresh token (optional)

        Returns:
            True if user has access to the bucket
        """
        def _inner() -> bool:
            credentials = self._create_user_credentials(access_token, refresh_token)

            try:
                # Create Storage client with user credentials
                client = storage.Client(project=project_id, credentials=credentials)
                bucket = client.bucket(bucket_name)

                # Try to access bucket metadata - this will fail if no access
                bucket.reload()
                return True

            except Exception:
                return False

        return await asyncio.to_thread(_inner)

    async def get_project_iam_policy(
        self,
        project_id: str,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get the IAM policy for a project to check service account permissions.

        Args:
            project_id: GCP project ID
            access_token: User's OAuth access token
            refresh_token: User's OAuth refresh token (optional)

        Returns:
            IAM policy information
        """
        def _inner() -> Dict[str, Any]:
            credentials = self._create_user_credentials(access_token, refresh_token)

            try:
                client = resourcemanager_v1.ProjectsClient(credentials=credentials)
                request = resourcemanager_v1.GetIamPolicyRequest(
                    resource=f"projects/{project_id}"
                )
                policy = client.get_iam_policy(request=request)

                # Convert to dictionary for easier handling
                return {
                    "bindings": [
                        {
                            "role": binding.role,
                            "members": list(binding.members),
                        }
                        for binding in policy.bindings
                    ],
                    "etag": policy.etag,
                    "version": policy.version,
                }

            except Exception as e:
                raise GoogleCloudError(f"Failed to get IAM policy for project {project_id}: {str(e)}") from e

        return await asyncio.to_thread(_inner)

    async def check_service_account_access(
        self,
        project_id: str,
        service_account_email: str,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> bool:
        """
        Check if omX service account has access to the project.

        Args:
            project_id: GCP project ID
            service_account_email: Service account email to check
            access_token: User's OAuth access token
            refresh_token: User's OAuth refresh token (optional)

        Returns:
            True if service account has storage admin access
        """
        try:
            policy = await self.get_project_iam_policy(project_id, access_token, refresh_token)

            # Check if service account has Storage Admin role
            for binding in policy["bindings"]:
                if (binding["role"] == "roles/storage.admin" and
                    f"serviceAccount:{service_account_email}" in binding["members"]):
                    return True

            return False

        except GoogleCloudError:
            return False


google_cloud_service = GoogleCloudService()

__all__ = ["google_cloud_service", "GoogleCloudError"]
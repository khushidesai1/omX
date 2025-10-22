"""Google OAuth 2.0 authentication service for omX."""

from __future__ import annotations

import base64
import json
import secrets
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google_auth_oauthlib.flow import Flow

from app.core.config import settings


class GoogleOAuthError(Exception):
    """Raised when OAuth operations fail."""


class GoogleOAuthService:
    """Service for handling Google OAuth 2.0 authentication flow."""

    def __init__(self):
        if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
            raise GoogleOAuthError("Google OAuth client credentials are not configured")

        self.client_id = settings.google_oauth_client_id
        self.client_secret = settings.google_oauth_client_secret
        self.redirect_uri = settings.google_oauth_redirect_uri

        # OAuth 2.0 scopes needed for listing projects and storage buckets
        self.scopes = [
            "https://www.googleapis.com/auth/cloud-platform.read-only",
            "https://www.googleapis.com/auth/cloudplatformprojects.readonly",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "openid",
            "email",
            "profile"
        ]

    def get_authorization_url(self, state: Optional[str] = None) -> tuple[str, str]:
        """
        Generate OAuth authorization URL and state.

        Returns:
            Tuple of (authorization_url, state)
        """
        if not state:
            state = secrets.token_urlsafe(32)

        auth_params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "response_type": "code",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(auth_params)}"
        return auth_url, state

    async def exchange_code_for_tokens(self, code: str, state: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens.

        Args:
            code: Authorization code from OAuth callback
            state: State parameter to validate request

        Returns:
            Dictionary containing tokens and user info
        """
        token_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
        }

        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise GoogleOAuthError(f"Token exchange failed: {token_response.text}")

            tokens = token_response.json()

            # Get user info using access token
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )

            if user_info_response.status_code != 200:
                raise GoogleOAuthError(f"Failed to get user info: {user_info_response.text}")

            user_info = user_info_response.json()

            return {
                "access_token": tokens["access_token"],
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in"),
                "token_type": tokens.get("token_type", "Bearer"),
                "user_info": user_info,
            }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh an expired access token using refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            Dictionary containing new access token info
        """
        refresh_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=refresh_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                raise GoogleOAuthError(f"Token refresh failed: {response.text}")

            return response.json()

    async def revoke_token(self, token: str) -> bool:
        """
        Revoke an access or refresh token.

        Args:
            token: Access or refresh token to revoke

        Returns:
            True if revocation was successful
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": token},
            )

            return response.status_code == 200

    def _get_service_account_credentials(self) -> Optional[service_account.Credentials]:
        """Get omX service account credentials for impersonation."""

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


# Initialize service only if credentials are configured
google_oauth_service: Optional[GoogleOAuthService] = None
if settings.google_oauth_client_id and settings.google_oauth_client_secret:
    google_oauth_service = GoogleOAuthService()

__all__ = ["google_oauth_service", "GoogleOAuthError"]

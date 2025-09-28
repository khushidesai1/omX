from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, oauth2_scheme
from app.core.config import settings
from app.core.security import (
  create_access_token,
  create_session_identifier,
  get_password_hash,
  hash_token,
  verify_password,
)
from app.models import AllowedEmail, User, UserSession
from app.schemas.auth import LogoutResponse, TokenResponse
from app.schemas.user import (
  AccessRequest,
  EmailCheckRequest,
  EmailEligibilityResponse,
  MessageResponse,
  UserCreate,
  UserLogin,
  UserRead,
)
from app.services.email import send_access_request_email
from app.services.google_oauth import GoogleOAuthError, google_oauth_service


router = APIRouter()


def _normalize_email(value: str) -> str:
  return value.strip().lower()


async def _is_email_allowed(email: str, db: AsyncSession) -> bool:
  allowed_result = await db.execute(select(AllowedEmail).where(AllowedEmail.email == email))
  return allowed_result.scalar_one_or_none() is not None


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserRead:
  normalized_email = _normalize_email(payload.email)
  if not await _is_email_allowed(normalized_email, db):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email is not approved for access")

  existing = await db.execute(select(User).where(User.email == normalized_email))
  if existing.scalar_one_or_none():
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

  user = User(
    email=normalized_email,
    password_hash=get_password_hash(payload.password),
    first_name=payload.first_name,
    last_name=payload.last_name,
  )
  db.add(user)
  await db.commit()
  await db.refresh(user)
  return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
  user_result = await db.execute(select(User).where(User.email == _normalize_email(payload.email)))
  user = user_result.scalar_one_or_none()
  if not user or not verify_password(payload.password, user.password_hash):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

  session_id = create_session_identifier()
  token, expiry = create_access_token(
    subject=user.id,
    session_id=session_id,
    expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
  )

  session_record = UserSession(
    id=session_id,
    user_id=user.id,
    token_hash=hash_token(token),
    expires_at=expiry,
  )
  db.add(session_record)
  await db.commit()

  return TokenResponse(
    access_token=token,
    expires_in=settings.access_token_expire_minutes * 60,
    user=UserRead.model_validate(user),
  )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
  current_user: User = Depends(get_current_active_user),
  token: str = Depends(oauth2_scheme),
  db: AsyncSession = Depends(get_db),
) -> LogoutResponse:
  token_hash_value = hash_token(token)
  session_query = await db.execute(
    select(UserSession).where(
      UserSession.user_id == current_user.id,
      UserSession.token_hash == token_hash_value,
    )
  )
  session_obj = session_query.scalar_one_or_none()
  if session_obj:
    await db.delete(session_obj)
    await db.commit()

  return LogoutResponse(message="Logged out", timestamp=datetime.now(timezone.utc))


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_active_user)) -> UserRead:
  return UserRead.model_validate(current_user)


@router.post("/check-email", response_model=EmailEligibilityResponse)
async def check_email(payload: EmailCheckRequest, db: AsyncSession = Depends(get_db)) -> EmailEligibilityResponse:
  normalized_email = _normalize_email(payload.email)
  is_allowed = await _is_email_allowed(normalized_email, db)
  return EmailEligibilityResponse(email=normalized_email, eligible=is_allowed)


@router.post("/request-access", response_model=MessageResponse)
async def request_access(payload: AccessRequest) -> MessageResponse:
  normalized_email = _normalize_email(payload.email)
  send_access_request_email(normalized_email)
  return MessageResponse(message="Access request submitted.")


# Google OAuth endpoints

@router.get("/google/login")
async def google_login(
    redirect_to: Optional[str] = Query(None, description="URL to redirect to after successful authentication")
) -> Dict[str, str]:
  """
  Initiate Google OAuth login flow.

  Returns authorization URL that frontend should redirect user to.
  """
  try:
    # Include redirect_to in state if provided
    state = f"redirect_to={redirect_to}" if redirect_to else None
    auth_url, state = google_oauth_service.get_authorization_url(state=state)

    return {
      "authorization_url": auth_url,
      "state": state
    }
  except GoogleOAuthError as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Failed to initiate OAuth flow: {str(e)}"
    ) from e


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="State parameter for security"),
    error: Optional[str] = Query(None, description="Error from OAuth provider"),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
  """
  Handle Google OAuth callback.

  This endpoint processes the authorization code and creates/updates user session.
  """
  if error:
    # User denied authorization or other OAuth error occurred
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"OAuth authorization failed: {error}"
    )

  if not code:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Authorization code is required"
    )

  try:
    # Exchange authorization code for tokens
    token_data = await google_oauth_service.exchange_code_for_tokens(code, state or "")

    # Extract user information
    user_info = token_data["user_info"]

    # TODO: Store or update user OAuth tokens in database
    # This would involve:
    # 1. Finding/creating user by email
    # 2. Storing OAuth tokens securely
    # 3. Creating/updating user session

    # For now, redirect with success status
    # Extract redirect URL from state if provided
    redirect_url = "/"
    if state and state.startswith("redirect_to="):
      redirect_url = state[12:]  # Remove "redirect_to=" prefix

    # In production, you'd redirect to frontend with success token
    return RedirectResponse(
      url=f"{redirect_url}?oauth_success=true&email={user_info['email']}",
      status_code=status.HTTP_302_FOUND
    )

  except GoogleOAuthError as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Failed to process OAuth callback: {str(e)}"
    ) from e


@router.post("/google/refresh")
async def refresh_google_token(
    refresh_token: str,
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
  """
  Refresh expired Google access token.
  """
  try:
    token_data = await google_oauth_service.refresh_access_token(refresh_token)

    # TODO: Update stored tokens in database

    return {
      "access_token": token_data["access_token"],
      "expires_in": str(token_data.get("expires_in", 3600)),
      "token_type": token_data.get("token_type", "Bearer")
    }

  except GoogleOAuthError as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Failed to refresh token: {str(e)}"
    ) from e


@router.post("/google/revoke")
async def revoke_google_token(
    token: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
  """
  Revoke Google OAuth tokens and remove stored credentials.
  """
  try:
    success = await google_oauth_service.revoke_token(token)

    if success:
      # TODO: Remove stored OAuth tokens from database
      return {"message": "Token revoked successfully"}
    else:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Failed to revoke token"
      )

  except GoogleOAuthError as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Failed to revoke token: {str(e)}"
    ) from e


@router.get("/test-service-account")
async def test_service_account() -> Dict[str, Any]:
  """
  Test endpoint to verify service account configuration.
  """
  try:
    credentials = google_oauth_service._get_service_account_credentials()
    if credentials:
      return {
        "status": "success",
        "message": "Service account loaded successfully",
        "service_account_email": credentials.service_account_email,
        "project_id": getattr(credentials, 'project_id', 'Not available')
      }
    else:
      return {
        "status": "error",
        "message": "Failed to load service account credentials",
        "details": "Check OMX_SERVICE_ACCOUNT_KEY_BASE64 or OMX_SERVICE_ACCOUNT_KEY_PATH environment variables"
      }
  except Exception as e:
    return {
      "status": "error",
      "message": f"Error loading service account: {str(e)}",
      "details": "Check your service account configuration and key format"
    }

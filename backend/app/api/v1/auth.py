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
  create_signed_state,
  create_session_identifier,
  decode_signed_state,
  get_password_hash,
  hash_token,
  verify_password,
)
from app.models import AllowedEmail, User, UserSession
from app.schemas.auth import GoogleAuthStatus, GoogleRefreshResponse, LogoutResponse, TokenResponse
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
from app.services.google_credentials import (delete_credentials, get_credentials, get_decrypted_refresh_token, upsert_credentials)
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
    redirect_to: Optional[str] = Query(None, description="URL to redirect to after successful authentication"),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
  """Generate the Google OAuth authorization URL for the current user."""
  try:
    payload: Dict[str, Any] = {"user_id": current_user.id}
    if redirect_to:
      payload["redirect_to"] = redirect_to
    state_token = create_signed_state(payload)
    auth_url, _ = google_oauth_service.get_authorization_url(state=state_token)
    return {"authorization_url": auth_url, "state": state_token}
  except GoogleOAuthError as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Failed to initiate OAuth flow: {str(e)}",
    ) from e


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="Signed state tracking the initiating user"),
    error: Optional[str] = Query(None, description="Error from OAuth provider"),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
  if error:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth authorization failed: {error}")
  if not code or not state:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Authorization code and state are required")

  try:
    state_data = decode_signed_state(state)
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state") from exc

  user_id = state_data.get("user_id")
  if not user_id:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth state missing user reference")

  redirect_url = state_data.get("redirect_to") or "/"

  try:
    token_data = await google_oauth_service.exchange_code_for_tokens(code, state)
  except GoogleOAuthError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to process OAuth callback: {str(exc)}") from exc

  user_query = await db.execute(select(User).where(User.id == user_id))
  user = user_query.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for OAuth callback")

  user_info = token_data.get("user_info", {})
  scopes = token_data.get("scope")
  scope_list = scopes.split() if isinstance(scopes, str) else None

  await upsert_credentials(
    db,
    user_id=user.id,
    google_email=user_info.get("email"),
    access_token=token_data.get("access_token"),
    refresh_token=token_data.get("refresh_token"),
    expires_in=token_data.get("expires_in"),
    scopes=scope_list,
  )
  await db.commit()

  return RedirectResponse(url=f"{redirect_url}?oauth_success=true", status_code=status.HTTP_302_FOUND)


@router.get("/google/status", response_model=GoogleAuthStatus)
async def google_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> GoogleAuthStatus:
  record = await get_credentials(db, current_user.id)
  if not record:
    return GoogleAuthStatus(connected=False)
  return GoogleAuthStatus(
    connected=True,
    google_email=record.google_email,
    expires_at=record.access_token_expires_at,
  )


@router.post("/google/refresh", response_model=GoogleRefreshResponse)
async def refresh_google_token(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> GoogleRefreshResponse:
  record = await get_credentials(db, current_user.id)
  if not record:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google account not linked")

  refresh_token = get_decrypted_refresh_token(record)
  if not refresh_token:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No refresh token stored for user")

  try:
    token_data = await google_oauth_service.refresh_access_token(refresh_token)
  except GoogleOAuthError as exc:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to refresh token: {str(exc)}") from exc

  new_refresh = token_data.get("refresh_token") or refresh_token
  await upsert_credentials(
    db,
    user_id=current_user.id,
    google_email=record.google_email,
    access_token=token_data.get("access_token"),
    refresh_token=new_refresh,
    expires_in=token_data.get("expires_in"),
    scopes=None,
  )
  await db.commit()

  return GoogleRefreshResponse(
    access_token=token_data.get("access_token", ""),
    expires_in=token_data.get("expires_in", 3600),
    token_type=token_data.get("token_type", "Bearer"),
  )


@router.post("/google/revoke")
async def revoke_google_token(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
  record = await get_credentials(db, current_user.id)
  if not record:
    return {"message": "No Google credentials stored"}

  refresh_token = get_decrypted_refresh_token(record)
  success = True
  if refresh_token:
    try:
      success = await google_oauth_service.revoke_token(refresh_token)
    except GoogleOAuthError:
      success = False

  await delete_credentials(db, current_user.id)
  await db.commit()

  if not success:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to revoke Google token")
  return {"message": "Google connection revoked"}


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

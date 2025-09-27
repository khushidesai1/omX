from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
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

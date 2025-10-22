from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
  from app.models.user import User


class UserGoogleCredential(Base, TimestampMixin):
  __tablename__ = "user_google_credentials"
  __table_args__ = (UniqueConstraint("user_id", name="uq_user_google_credentials_user_id"),)

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  google_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
  scopes: Mapped[str | None] = mapped_column(Text(), nullable=True)
  access_token_encrypted: Mapped[str | None] = mapped_column(Text(), nullable=True)
  refresh_token_encrypted: Mapped[str | None] = mapped_column(Text(), nullable=True)
  access_token_expires_at: Mapped[datetime | None] = mapped_column(nullable=True)

  user: Mapped["User"] = relationship("User", back_populates="google_credentials")

__all__ = ["UserGoogleCredential"]

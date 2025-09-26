from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AllowedEmail(Base):
  __tablename__ = "allowed_emails"

  email: Mapped[str] = mapped_column(String(255), primary_key=True)
  note: Mapped[str | None] = mapped_column(String(255), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

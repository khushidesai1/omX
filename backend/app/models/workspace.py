from __future__ import annotations

import uuid

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Workspace(Base, TimestampMixin):
  __tablename__ = "workspaces"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  description: Mapped[str | None] = mapped_column(String, nullable=True)
  owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  access_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
  invite_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
  is_public: Mapped[bool] = mapped_column(Boolean, default=False)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True)

  owner: Mapped["User"] = relationship(back_populates="workspaces_owned")
  members: Mapped[list["WorkspaceMember"]] = relationship(
    back_populates="workspace",
    cascade="all, delete-orphan",
  )
  projects: Mapped[list["Project"]] = relationship(
    back_populates="workspace",
    cascade="all, delete-orphan",
  )


class WorkspaceMember(Base):
  __tablename__ = "workspace_members"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  workspace_id: Mapped[str] = mapped_column(
    String(36),
    ForeignKey("workspaces.id", ondelete="CASCADE"),
    nullable=False,
  )
  user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  role: Mapped[str] = mapped_column(String(50), default="member")
  joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  workspace: Mapped[Workspace] = relationship(back_populates="members")
  user: Mapped["User"] = relationship(back_populates="memberships")


from app.models.user import User  # noqa: E402  # isort:skip
from app.models.project import Project  # noqa: E402  # isort:skip

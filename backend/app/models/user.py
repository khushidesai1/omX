from __future__ import annotations

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class User(Base, TimestampMixin):
  __tablename__ = "users"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
  password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
  last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True)

  workspaces_owned: Mapped[list["Workspace"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
  memberships: Mapped[list["WorkspaceMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
  projects_created: Mapped[list["Project"]] = relationship(back_populates="creator")
  sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


from app.models.workspace import Workspace, WorkspaceMember  # noqa: E402  # isort:skip
from app.models.project import Project  # noqa: E402  # isort:skip
from app.models.session import UserSession  # noqa: E402  # isort:skip

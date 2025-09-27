from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

try:
  JSONType = JSONB  # type: ignore[assignment]
except ImportError:  # pragma: no cover - fallback when dialect unavailable
  from sqlalchemy import JSON as JSONType  # type: ignore


class Project(Base, TimestampMixin):
  __tablename__ = "projects"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  description: Mapped[str | None] = mapped_column(String, nullable=True)
  workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
  created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
  project_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
  tags: Mapped[list[str]] = mapped_column(JSONType, default=list)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True)

  workspace: Mapped["Workspace"] = relationship(back_populates="projects")
  creator: Mapped["User"] = relationship(back_populates="projects_created")
  storage_connections: Mapped[list["ProjectStorageConnection"]] = relationship(
    "ProjectStorageConnection",
    back_populates="project",
    cascade="all, delete-orphan",
  )


from app.models.workspace import Workspace  # noqa: E402  # isort:skip
from app.models.user import User  # noqa: E402  # isort:skip
from app.models.storage import ProjectStorageConnection  # noqa: E402  # isort:skip

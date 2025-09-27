from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class ProjectStorageConnection(Base, TimestampMixin):
  __tablename__ = "project_storage_connections"

  id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  project_id: Mapped[str] = mapped_column(
    String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
  )
  bucket_name: Mapped[str] = mapped_column(String(255), nullable=False)
  gcp_project_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
  prefix: Mapped[str | None] = mapped_column(String(512), nullable=True)
  description: Mapped[str | None] = mapped_column(String(512), nullable=True)
  created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

  project: Mapped["Project"] = relationship("Project", back_populates="storage_connections")
  creator: Mapped["User"] = relationship("User")


from app.models.project import Project  # noqa: E402
from app.models.user import User  # noqa: E402

__all__ = ["ProjectStorageConnection"]

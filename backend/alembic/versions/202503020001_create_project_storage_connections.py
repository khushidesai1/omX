"""create project storage connections table

Revision ID: 202503020001
Revises: 202502150003
Create Date: 2025-03-02 00:01:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202503020001"
down_revision = "202502150003"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "project_storage_connections",
    sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
    sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
    sa.Column("bucket_name", sa.String(length=255), nullable=False),
    sa.Column("gcp_project_id", sa.String(length=128), nullable=True),
    sa.Column("prefix", sa.String(length=512), nullable=True),
    sa.Column("description", sa.String(length=512), nullable=True),
    sa.Column("created_by", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )
  op.create_index(
    "ix_project_storage_connections_project_id",
    "project_storage_connections",
    ["project_id"],
  )


def downgrade() -> None:
  op.drop_index("ix_project_storage_connections_project_id", table_name="project_storage_connections")
  op.drop_table("project_storage_connections")

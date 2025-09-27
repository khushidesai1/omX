"""add workspace slug

Revision ID: 202502150002
Revises: 202502150001
Create Date: 2025-02-15 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision = "202502150002"
down_revision = "202502150001"
branch_labels = None
depends_on = None

workspace_table = table(
  "workspaces",
  column("id", sa.String),
  column("invite_code", sa.String),
  column("slug", sa.String),
)


def slugify(value: str) -> str:
  return ''.join(ch for ch in value.lower() if ch.isalnum() or ch == '-')


def upgrade() -> None:
  op.add_column("workspaces", sa.Column("slug", sa.String(length=64), nullable=True))
  connection = op.get_bind()
  result = connection.execute(sa.text("SELECT id, invite_code FROM workspaces"))
  for row in result:
    slug = slugify(row.invite_code or '') or row.id.split('-')[0]
    connection.execute(
      sa.text("UPDATE workspaces SET slug = :slug WHERE id = :id"),
      {"slug": slug, "id": row.id},
    )
  op.alter_column("workspaces", "slug", nullable=False)
  op.create_unique_constraint(op.f("uq_workspaces_slug"), "workspaces", ["slug"])


def downgrade() -> None:
  op.drop_constraint(op.f("uq_workspaces_slug"), "workspaces", type_="unique")
  op.drop_column("workspaces", "slug")

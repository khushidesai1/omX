"""remove invite code column

Revision ID: 202502150003
Revises: 202502150002
Create Date: 2025-02-15 00:01:00
"""

from alembic import op
import sqlalchemy as sa


def _has_column(table_name: str, column_name: str) -> bool:
  bind = op.get_bind()
  inspector = sa.inspect(bind)
  columns = [col["name"] for col in inspector.get_columns(table_name)]
  return column_name in columns


revision = "202502150003"
down_revision = "202502150002"
branch_labels = None
depends_on = None


def upgrade() -> None:
  if _has_column("workspaces", "invite_code"):
    with op.batch_alter_table("workspaces") as batch:
      batch.drop_column("invite_code")


def downgrade() -> None:
  if not _has_column("workspaces", "invite_code"):
    with op.batch_alter_table("workspaces") as batch:
      batch.add_column(sa.Column("invite_code", sa.String(length=50), nullable=True))
      batch.create_unique_constraint("uq_workspaces_invite_code", ["invite_code"])

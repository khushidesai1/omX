"""add user google credentials table

Revision ID: 202503150001
Revises: 202503020001
Create Date: 2025-03-15 00:01:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202503150001"
down_revision = "202503020001"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "user_google_credentials",
    sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
    sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
    sa.Column("google_email", sa.String(length=255), nullable=True),
    sa.Column("scopes", sa.Text(), nullable=True),
    sa.Column("access_token_encrypted", sa.Text(), nullable=True),
    sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
    sa.Column("access_token_expires_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )


def downgrade() -> None:
  op.drop_table("user_google_credentials")

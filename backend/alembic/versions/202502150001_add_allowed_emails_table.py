"""add allowed emails table

Revision ID: 202502150001
Revises: 202401010001
Create Date: 2025-02-15 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202502150001"
down_revision = "202401010001"
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "allowed_emails",
    sa.Column("email", sa.String(length=255), primary_key=True),
    sa.Column("note", sa.String(length=255), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )

  op.execute(
    sa.text("INSERT INTO allowed_emails (email, note) VALUES (:email, :note)")
    .bindparams(email="kpd2137@columbia.edu", note="Initial allow list"),
  )


def downgrade() -> None:
  op.drop_table("allowed_emails")

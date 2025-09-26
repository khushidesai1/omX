import logging

from app.db import base  # noqa: F401
from app.db.session import engine

logger = logging.getLogger(__name__)


async def init_db() -> None:
  """Create database tables for initial development.

  In production environments prefer running Alembic migrations.
  """

  async with engine.begin() as connection:
    await connection.run_sync(base.Base.metadata.create_all)
  logger.info("Database schema ensured.")

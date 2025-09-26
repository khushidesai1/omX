from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import async_engine_from_config

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
for path in {PROJECT_ROOT, BASE_DIR}:
  if path not in sys.path:
    sys.path.insert(0, path)

from app.core.config import settings
from app.db.base import Base
from app.models import *  # noqa: F401,F403

config = context.config

if config.config_file_name is not None:
  fileConfig(config.config_file_name)

section = config.get_section(config.config_ini_section)
if section is not None:
  section["sqlalchemy.url"] = settings.database_url

target_metadata = Base.metadata


def run_migrations_offline() -> None:
  url = settings.database_url
  context.configure(
    url=url,
    target_metadata=target_metadata,
    literal_binds=True,
    dialect_opts={"paramstyle": "named"},
  )

  with context.begin_transaction():
    context.run_migrations()


def do_run_migrations(connection) -> None:
  context.configure(connection=connection, target_metadata=target_metadata)

  with context.begin_transaction():
    context.run_migrations()


async def run_migrations_online() -> None:
  connectable = async_engine_from_config(
    section or {},
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
  )

  async with connectable.connect() as connection:
    await connection.run_sync(do_run_migrations)

  await connectable.dispose()


if context.is_offline_mode():
  run_migrations_offline()
else:
  asyncio.run(run_migrations_online())

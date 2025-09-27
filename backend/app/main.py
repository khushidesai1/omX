from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.db.init_db import init_db


def _configure_cors(application: FastAPI) -> None:
  application.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.cors_origins],
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )


def create_app() -> FastAPI:
  application = FastAPI(title=settings.project_name)
  _configure_cors(application)

  application.include_router(api_router, prefix=settings.api_v1_prefix)

  @application.get("/health", tags=["health"])
  async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

  @application.on_event("startup")
  async def on_startup() -> None:  # pragma: no cover - lifecycle hook
    if settings.database_url.startswith("sqlite+"):
      await init_db()

  return application


app = create_app()

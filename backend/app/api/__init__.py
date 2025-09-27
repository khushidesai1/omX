"""API package exposing application routers."""

from fastapi import APIRouter

from app.api.v1 import auth, projects, storage, workspaces

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(storage.router, tags=["storage"])

__all__ = ["api_router"]

"""API package exposing application routers."""

from fastapi import APIRouter

from app.api.v1 import auth, projects, workspaces

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(projects.router, tags=["projects"])

__all__ = ["api_router"]

"""
Player API routes module.
Contains all routes related to player functionality.
"""

from fastapi import APIRouter
from .profile import router as profile_router

# Main player router
router = APIRouter(tags=["player"])

# Include all sub-routers
router.include_router(profile_router)

__all__ = ["router"]


"""
Club Manager API routes module.
Contains all routes related to club manager functionality.
"""

from fastapi import APIRouter
from .profile import router as profile_router
from .players import router as players_router
from .invitations import router as invitations_router
from .fixtures import router as fixtures_router
from .wallet import router as wallet_router
from .enrollment import router as enrollment_router

# Main club manager router (no prefix to maintain backward compatibility)
router = APIRouter(tags=["club_manager"])

# Include all sub-routers
router.include_router(profile_router)
router.include_router(players_router)
router.include_router(invitations_router)
router.include_router(fixtures_router)
router.include_router(wallet_router)
router.include_router(enrollment_router)

__all__ = ["router"]


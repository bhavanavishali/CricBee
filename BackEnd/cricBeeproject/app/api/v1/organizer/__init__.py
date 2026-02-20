"""
Organizer API routes module.
Contains all routes related to organizer functionality.
"""

from fastapi import APIRouter
from .profile import router as profile_router
from .tournament import router as tournament_router
from .fixture import router as fixture_router
from .match_score import router as match_score_router
from .point_table_final import router as point_table_router
from .round_completion import router as round_completion_router
from .round_progression import router as round_progression_router

# Main organizer router (no prefix to maintain backward compatibility)
router = APIRouter(tags=["organizer"])

# Include all sub-routers
router.include_router(profile_router)
router.include_router(tournament_router)
router.include_router(fixture_router)
router.include_router(match_score_router)
router.include_router(point_table_router)
router.include_router(round_completion_router)
router.include_router(round_progression_router)

__all__ = ["router"]

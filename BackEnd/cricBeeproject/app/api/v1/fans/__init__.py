"""Fan API routes package"""
from fastapi import APIRouter
from .tournaments import router as tournaments_router
from .matches import router as matches_router
from .notifications import router as notifications_router

# Create main fans router with /public prefix for public endpoints
router = APIRouter(prefix="/api/v1/fans", tags=["fans"])

# Include all fan-related sub-routers
router.include_router(tournaments_router)
router.include_router(matches_router)
router.include_router(notifications_router)

__all__ = ["router"]


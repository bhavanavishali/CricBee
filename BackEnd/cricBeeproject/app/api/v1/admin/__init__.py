from fastapi import APIRouter
from .users import router as users_router
from .pricing_plans import router as pricing_plans_router
from .transactions import router as transactions_router
from .tournaments import router as tournaments_router


router = APIRouter(prefix="/admin", tags=["admin"])


router.include_router(users_router)
router.include_router(pricing_plans_router)
router.include_router(transactions_router)
router.include_router(tournaments_router)

__all__ = ["router"]


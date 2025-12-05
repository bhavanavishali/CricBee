from fastapi import APIRouter
from app.api.v1.clubmanager.enrollment import router as enrollment_router

router = APIRouter()

router.include_router(enrollment_router)


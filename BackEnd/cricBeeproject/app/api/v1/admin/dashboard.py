from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin.dashboard import AdminDashboardStatsResponse
from app.services.admin.dashboard_service import get_admin_dashboard_stats
from app.utils.admin_dependencies import get_current_admin_user

router = APIRouter()


@router.get("/dashboard/stats", response_model=AdminDashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    stats = get_admin_dashboard_stats(db)
    return AdminDashboardStatsResponse(**stats)

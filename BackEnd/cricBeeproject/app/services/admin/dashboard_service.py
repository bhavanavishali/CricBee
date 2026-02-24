from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.organizer.tournament import Tournament, TournamentStatus
from app.services.admin.transaction_service import get_financial_statistics


def get_admin_dashboard_stats(db: Session) -> dict:
    """Return total_users, total_tournaments, active_tournaments, total_revenue for admin dashboard."""
    total_users = db.query(User).filter(User.role != UserRole.ADMIN).count()

    total_tournaments = db.query(func.count(Tournament.id)).scalar() or 0

    active_statuses = [
        TournamentStatus.PENDING_PAYMENT.value,
        TournamentStatus.REGISTRATION_OPEN.value,
        TournamentStatus.REGISTRATION_END.value,
        TournamentStatus.TOURNAMENT_START.value,
        TournamentStatus.TOURNAMENT_END.value,
    ]
    active_tournaments = (
        db.query(func.count(Tournament.id))
        .filter(Tournament.status.in_(active_statuses))
        .scalar()
        or 0
    )

    financial = get_financial_statistics(db)
    total_revenue = financial.get("total_revenue", 0.0)

    return {
        "total_users": total_users,
        "total_tournaments": total_tournaments,
        "active_tournaments": active_tournaments,
        "total_revenue": total_revenue,
    }

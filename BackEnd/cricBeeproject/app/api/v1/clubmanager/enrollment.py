from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.organizer.tournament import TournamentResponse
from app.services.clubmanager.enrollment import get_eligible_tournaments_for_club_manager
from app.utils.jwt import get_current_user
from typing import List

router = APIRouter(prefix="/clubmanager", tags=["clubmanager"])

@router.get("/tournaments", response_model=List[TournamentResponse])
def get_eligible_tournaments_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get tournaments eligible for club manager enrollment"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view tournaments"
        )
    
    tournaments = get_eligible_tournaments_for_club_manager(db)
    return tournaments

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.services.admin.tournament_service import (
    get_all_tournaments,
    get_tournament_by_id,
    update_tournament_block_status
)
from app.schemas.admin.tournament import TournamentListResponse, TournamentBlockUpdate
from app.schemas.organizer.tournament import TournamentResponse
from app.utils.admin_dependencies import get_current_admin_user

router = APIRouter()


# Tournament Management Endpoints

@router.get("/tournaments", response_model=TournamentListResponse)
def list_all_tournaments(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):

    tournaments, total = get_all_tournaments(db, skip=skip, limit=limit)
    
    return TournamentListResponse(
        tournaments=[TournamentResponse.model_validate(t) for t in tournaments],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/tournaments/{tournament_id}", response_model=TournamentResponse)
def get_tournament_details(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):

    tournament = get_tournament_by_id(db, tournament_id)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    return TournamentResponse.model_validate(tournament)

@router.patch("/tournaments/{tournament_id}/block", response_model=TournamentResponse)
def block_unblock_tournament(
    tournament_id: int,
    payload: TournamentBlockUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
  
    tournament = update_tournament_block_status(db, tournament_id, payload.is_blocked)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    return TournamentResponse.model_validate(tournament)


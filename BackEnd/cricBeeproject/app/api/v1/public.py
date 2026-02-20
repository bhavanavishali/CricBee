
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.fans.tournament_service import (
    get_all_tournaments_for_fans,
    get_tournament_details_for_fans
)
from app.services.fans.match_service import (
    get_live_matches_for_fans,
    get_match_scoreboard_for_fans
)
from typing import List, Optional

router = APIRouter(prefix="/api/v1/public", tags=["public-deprecated"])


@router.get("/tournaments", response_model=List[dict], deprecated=True)
def get_all_tournaments(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None
):
  
    return get_all_tournaments_for_fans(db, status_filter)


@router.get("/tournaments/{tournament_id}", response_model=dict, deprecated=True)
def get_tournament_details(
    tournament_id: int,
    db: Session = Depends(get_db)
):
  
    try:
        return get_tournament_details_for_fans(db, tournament_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/matches/{match_id}/scoreboard", deprecated=True)
def get_public_scoreboard(
    match_id: int,
    db: Session = Depends(get_db)
):

    try:
        return get_match_scoreboard_for_fans(db, match_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/matches/live", response_model=List[dict], deprecated=True)
def get_live_matches(
    db: Session = Depends(get_db)
):

    return get_live_matches_for_fans(db)


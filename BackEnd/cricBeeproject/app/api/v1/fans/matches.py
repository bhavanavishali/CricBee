"""Fan API endpoints for matches - no authentication required"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.fans.match_service import (
    get_live_matches_for_fans,
    get_match_scoreboard_for_fans
)
from typing import List

router = APIRouter(prefix="/matches", tags=["fans-matches"])


@router.get("/live", response_model=List[dict])
def get_live_matches(
    db: Session = Depends(get_db)
):
    """Get all live matches for public viewing (fans)"""
    return get_live_matches_for_fans(db)


@router.get("/{match_id}/scoreboard")
def get_match_scoreboard(
    match_id: int,
    db: Session = Depends(get_db)
):
    """Get match scoreboard for public viewing (fans)"""
    try:
        return get_match_scoreboard_for_fans(db, match_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


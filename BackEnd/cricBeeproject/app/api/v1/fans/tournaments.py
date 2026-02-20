"""Fan API endpoints for tournaments - no authentication required"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.fans.tournament_service import (
    get_all_tournaments_for_fans,
    get_tournament_details_for_fans
)
from typing import List, Optional

router = APIRouter(prefix="/tournaments", tags=["fans-tournaments"])


@router.get("/", response_model=List[dict])
def get_all_tournaments(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None
):
    """Get all tournaments for public viewing (fans)"""
    return get_all_tournaments_for_fans(db, status_filter)


@router.get("/{tournament_id}", response_model=dict)
def get_tournament_details(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed tournament information for public viewing (fans)"""
    try:
        return get_tournament_details_for_fans(db, tournament_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.utils.jwt import get_current_user
from app.models.user import User
from app.services.organizer import point_table_service
from app.models.organizer.tournament import Tournament

router = APIRouter()

@router.get("/tournament/{tournament_id}")
def get_point_table(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:
       
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tournament not found"
            )
        
        point_table = point_table_service.get_point_table_by_tournament(db, tournament_id)
        return point_table
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching point table: {str(e)}"
        )

@router.post("/tournament/{tournament_id}/initialize")
def initialize_point_table(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:
        
        tournament = db.query(Tournament).filter(
            Tournament.id == tournament_id,
            Tournament.organizer_id == current_user.id
        ).first()
        
        if not tournament:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tournament not found or access denied"
            )
        
        point_entries = point_table_service.initialize_point_table_for_tournament(
            db, tournament_id
        )
        
        return {
            "message": "Point table initialized successfully",
            "tournament_id": tournament_id,
            "teams_count": len(point_entries)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing point table: {str(e)}"
        )

@router.delete("/tournament/{tournament_id}/reset")
def reset_point_table(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset point table for a tournament.
    Only organizer of the tournament can reset.
    """
    try:
        # Verify tournament exists and belongs to organizer
        tournament = db.query(Tournament).filter(
            Tournament.id == tournament_id,
            Tournament.organizer_id == current_user.id
        ).first()
        
        if not tournament:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tournament not found or access denied"
            )
        
        result = point_table_service.reset_point_table_for_tournament(db, tournament_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting point table: {str(e)}"
        )

@router.post("/match/{match_id}/update")
def update_point_table_for_match(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger point table update for a completed match.
    This is automatically called when match is completed, but can be manually triggered if needed.
    """
    try:
        result = point_table_service.update_point_table_after_match(db, match_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating point table: {str(e)}"
        )

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.organizer import round_completion_service

router = APIRouter(prefix="/round_completion", tags=["round_completion"])

@router.get("/round/{round_id}/status")
def check_round_status(
    round_id: int,
    tournament_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Check if all matches in a round are completed.
    """
    try:
        status_info = round_completion_service.check_round_completion(db, round_id, tournament_id)
        return status_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking round status: {str(e)}"
        )

@router.post("/tournament/{tournament_id}/add-club/{club_id}")
def add_club_to_round_two(
    tournament_id: int,
    club_id: int,
    db: Session = Depends(get_db)
):
    """
    Add a club to Round 2 selection.
    """
    try:
        # For now, use a hardcoded organizer_id (in production, get from auth)
        organizer_id = 1
        round_two_club = round_completion_service.add_club_to_round_two(
            db, tournament_id, club_id, organizer_id
        )
        return {
            "message": "Club added to Round 2 successfully",
            "club_id": club_id,
            "tournament_id": tournament_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding club to Round 2: {str(e)}"
        )

@router.delete("/tournament/{tournament_id}/remove-club/{club_id}")
def remove_club_from_round_two(
    tournament_id: int,
    club_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove a club from Round 2 selection.
    """
    try:
        # For now, use a hardcoded organizer_id (in production, get from auth)
        organizer_id = 1
        result = round_completion_service.remove_club_from_round_two(
            db, tournament_id, club_id, organizer_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing club from Round 2: {str(e)}"
        )

@router.get("/tournament/{tournament_id}/round-two-clubs")
def get_round_two_clubs(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """
    Get list of clubs selected for Round 2.
    """
    try:
        club_ids = round_completion_service.get_round_two_clubs(db, tournament_id)
        return {
            "tournament_id": tournament_id,
            "club_ids": club_ids,
            "count": len(club_ids)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Round 2 clubs: {str(e)}"
        )

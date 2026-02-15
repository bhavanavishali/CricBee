from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.organizer import round_progression_service
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/round_progression", tags=["round_progression"])

class QualifiedTeamsRequest(BaseModel):
    from_round: str
    to_round: str
    club_ids: List[int]

class TournamentWinnerRequest(BaseModel):
    winner_team_id: int

@router.post("/tournament/{tournament_id}/save-qualified-teams")
def save_qualified_teams(
    tournament_id: int,
    request: QualifiedTeamsRequest,
    db: Session = Depends(get_db)
):
    """
    Save qualified teams for the next round.
    """
    try:
        print(f"DEBUG: Received request - tournament_id: {tournament_id}")
        print(f"DEBUG: from_round: {request.from_round}, to_round: {request.to_round}")
        print(f"DEBUG: club_ids: {request.club_ids}")
        
        # For now, use a hardcoded organizer_id (in production, get from auth)
        organizer_id = 1
        result = round_progression_service.save_qualified_teams(
            db, 
            tournament_id, 
            request.from_round,
            request.to_round,
            request.club_ids,
            organizer_id
        )
        return result
    except ValueError as e:
        print(f"DEBUG: ValueError - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"DEBUG: Exception - {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving qualified teams: {str(e)}"
        )

@router.get("/tournament/{tournament_id}/qualified-teams")
def get_qualified_teams(
    tournament_id: int,
    from_round: str,
    to_round: str,
    db: Session = Depends(get_db)
):
    """
    Get qualified teams for a specific round progression.
    """
    try:
        club_ids = round_progression_service.get_qualified_teams(
            db, tournament_id, from_round, to_round
        )
        return {
            "tournament_id": tournament_id,
            "from_round": from_round,
            "to_round": to_round,
            "club_ids": club_ids,
            "count": len(club_ids)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching qualified teams: {str(e)}"
        )

@router.get("/tournament/{tournament_id}/all-qualified-for-round/{to_round}")
def get_all_qualified_for_round(
    tournament_id: int,
    to_round: str,
    db: Session = Depends(get_db)
):
    """
    Get all qualified teams for a specific target round.
    """
    try:
        club_ids = round_progression_service.get_all_qualified_teams_for_round(
            db, tournament_id, to_round
        )
        return {
            "tournament_id": tournament_id,
            "to_round": to_round,
            "club_ids": club_ids,
            "count": len(club_ids)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching qualified teams: {str(e)}"
        )

@router.post("/tournament/{tournament_id}/complete-with-winner")
def complete_tournament_with_winner(
    tournament_id: int,
    request: TournamentWinnerRequest,
    db: Session = Depends(get_db)
):
    """
    Complete tournament and mark the winner (for Round 3 completion).
    """
    try:
        print(f"DEBUG: Completing tournament {tournament_id} with winner {request.winner_team_id}")
        
        # For now, use a hardcoded organizer_id (in production, get from auth)
        organizer_id = 1
        result = round_progression_service.complete_tournament_with_winner(
            db, 
            tournament_id, 
            request.winner_team_id,
            organizer_id
        )
        return result
    except ValueError as e:
        print(f"DEBUG: ValueError - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"DEBUG: Exception - {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing tournament: {str(e)}"
        )

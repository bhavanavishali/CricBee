from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.organizer.match_score import (
    TossUpdate,
    TossResponse,
    UpdateScoreRequest,
    LiveScoreboardResponse,
    EndInningsRequest
)
from app.services.organizer.match_score_service import (
    update_toss,
    start_match,
    update_score,
    get_live_scoreboard,
    end_innings
)
from app.models.organizer.fixture import Match
from app.models.organizer.tournament import Tournament

router = APIRouter(prefix="/matches", tags=["match-score"])

@router.post("/{match_id}/toss", response_model=TossResponse, status_code=status.HTTP_200_OK)
def update_toss_endpoint(
    match_id: int,
    toss_data: TossUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update toss result for a match (organizer only)"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update toss"
        )
    
    try:
        match = update_toss(db, match_id, current_user.id, toss_data)
        
        # Build response
        return TossResponse(
            toss_winner_id=match.toss_winner_id,
            toss_winner_name=match.toss_winner.club_name if match.toss_winner else None,
            toss_decision=match.toss_decision,
            batting_team_id=match.batting_team_id,
            batting_team_name=match.batting_team.club_name if match.batting_team else None,
            bowling_team_id=match.bowling_team_id,
            bowling_team_name=match.bowling_team.club_name if match.bowling_team else None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/start", status_code=status.HTTP_200_OK)
def start_match_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Start a match - initialize scoreboard (organizer only)"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can start matches"
        )
    
    try:
        match = start_match(db, match_id, current_user.id)
        return {
            "message": "Match started successfully",
            "match_id": match.id,
            "match_status": match.match_status
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/score", status_code=status.HTTP_200_OK)
def update_score_endpoint(
    match_id: int,
    score_data: UpdateScoreRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update score for a ball (organizer only)"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update scores"
        )
    
    try:
        ball_record = update_score(db, match_id, current_user.id, score_data)
        return {
            "message": "Score updated successfully",
            "ball_id": ball_record.id,
            "over": ball_record.over_number,
            "ball": ball_record.ball_number
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{match_id}/scoreboard", response_model=LiveScoreboardResponse)
def get_scoreboard_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get live scoreboard for a match (public endpoint)"""
    # Verify user is authenticated
    current_user = get_current_user(request, db)
    
    try:
        scoreboard = get_live_scoreboard(db, match_id)
        return scoreboard
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/end-innings", status_code=status.HTTP_200_OK)
def end_innings_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """End the current innings (organizer only)"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can end innings"
        )
    
    try:
        match = end_innings(db, match_id, current_user.id)
        return {
            "message": "Innings ended successfully",
            "match_id": match.id,
            "match_status": match.match_status
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )






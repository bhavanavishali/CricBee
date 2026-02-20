# api/v1/clubmanager/fixtures.py
"""
Fixtures & Playing XI Management Routes
Handles match fixtures and playing XI selection
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import ClubPlayerResponse, ClubPlayersListResponse
from app.services.clubmanager.club_profile_service import get_club
from app.services.clubmanager.fixture_service import (
    get_club_manager_matches,
    get_club_players_for_match,
    set_playing_xi,
    get_playing_xi
)
from app.schemas.organizer.fixture import MatchResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.schemas.player import PlayerRead
from app.schemas.user import UserRead
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["fixtures"])


class PlayingXICreate(BaseModel):
    """Schema for creating Playing XI"""
    player_ids: List[int]
    captain_id: Optional[int] = None
    vice_captain_id: Optional[int] = None


class PlayingXIResponse(BaseModel):
    """Schema for Playing XI response"""
    id: int
    match_id: int
    club_id: int
    player_id: int
    is_captain: bool
    is_vice_captain: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/fixtures", response_model=List[MatchResponse])
def get_my_fixtures(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all fixtures for the club manager's club"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        matches = get_club_manager_matches(db, club.id, current_user.id)
        match_responses = [
            MatchResponse(
                id=match.id,
                round_id=match.round_id,
                tournament_id=match.tournament_id,
                match_number=match.match_number,
                team_a_id=match.team_a_id,
                team_a_name=match.team_a.club_name if match.team_a else None,
                team_b_id=match.team_b_id,
                team_b_name=match.team_b.club_name if match.team_b else None,
                match_date=match.match_date,
                match_time=match.match_time,
                venue=match.venue,
                is_fixture_published=match.is_fixture_published,
                tournament_name=match.tournament.tournament_name if match.tournament else None,
                round_name=match.round.round_name if match.round else None,
                created_at=match.created_at,
                updated_at=match.updated_at
            )
            for match in matches
        ]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/fixtures/{match_id}/players", response_model=ClubPlayersListResponse)
def get_club_players_for_match_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all available players for a specific match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        club_players = get_club_players_for_match(db, club.id, current_user.id)
        return ClubPlayersListResponse(
            players=[
                ClubPlayerResponse(
                    id=cp.id,
                    player_profile=PlayerRead.model_validate(cp.player),
                    user=UserRead.model_validate(cp.player.user),
                    joined_at=cp.joined_at
                )
                for cp in club_players
            ],
            total=len(club_players)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/fixtures/{match_id}/playing-xi", response_model=List[PlayingXIResponse])
def set_playing_xi_endpoint(
    match_id: int,
    payload: PlayingXICreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Set the Playing XI for a specific match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    if len(payload.player_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one player must be selected"
        )
    
    try:
        playing_xi_list = set_playing_xi(
            db, 
            match_id, 
            club.id, 
            current_user.id, 
            payload.player_ids,
            payload.captain_id,
            payload.vice_captain_id
        )
        return [PlayingXIResponse.model_validate(pxi) for pxi in playing_xi_list]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/fixtures/{match_id}/playing-xi", response_model=List[PlayingXIResponse])
def get_playing_xi_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get the Playing XI for a specific match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        playing_xi_list = get_playing_xi(db, match_id, club.id)
        return [PlayingXIResponse.model_validate(pxi) for pxi in playing_xi_list]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


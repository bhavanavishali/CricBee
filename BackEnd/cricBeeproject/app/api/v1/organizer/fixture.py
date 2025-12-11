from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.organizer.fixture import (
    FixtureRoundCreate,
    FixtureRoundResponse,
    MatchCreate,
    MatchResponse,
    FixtureRoundWithMatchesResponse
)
from app.services.organizer.fixture_service import (
    can_create_fixture,
    create_fixture_round,
    get_tournament_rounds,
    create_match,
    get_round_matches,
    get_tournament_matches,
    toggle_match_published_status,
    get_published_tournament_matches,
    get_published_round_matches
)
from typing import List
from app.models.organizer.fixture import Match

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

def build_match_response(match: Match) -> MatchResponse:
    """Helper function to build MatchResponse from Match model"""
    return MatchResponse(
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
        toss_winner_id=match.toss_winner_id,
        toss_winner_name=match.toss_winner.club_name if match.toss_winner else None,
        toss_decision=match.toss_decision,
        batting_team_id=match.batting_team_id,
        batting_team_name=match.batting_team.club_name if match.batting_team else None,
        bowling_team_id=match.bowling_team_id,
        bowling_team_name=match.bowling_team.club_name if match.bowling_team else None,
        match_status=match.match_status,
        created_at=match.created_at,
        updated_at=match.updated_at
    )

@router.get("/tournaments/{tournament_id}/can-create", response_model=dict)
def check_can_create_fixture(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Check if fixture can be created for a tournament"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can manage fixtures"
        )
    
    can_create, message = can_create_fixture(db, tournament_id, current_user.id)
    return {
        "can_create": can_create,
        "message": message
    }

@router.post("/rounds", response_model=FixtureRoundResponse, status_code=status.HTTP_201_CREATED)
def create_round(
    round_data: FixtureRoundCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a fixture round"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create fixture rounds"
        )
    
    try:
        round = create_fixture_round(db, round_data, current_user.id)
        return round
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/rounds", response_model=List[FixtureRoundResponse])
def get_rounds(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all rounds for a tournament"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view fixture rounds"
        )
    
    try:
        rounds = get_tournament_rounds(db, tournament_id, current_user.id)
        return rounds
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/matches", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match_endpoint(
    match_data: MatchCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create matches"
        )
    
    try:
        match = create_match(db, match_data, current_user.id)
        # Reload with relationships
        match = db.query(Match).options(
            joinedload(Match.team_a),
            joinedload(Match.team_b),
            joinedload(Match.toss_winner),
            joinedload(Match.batting_team),
            joinedload(Match.bowling_team)
        ).filter(Match.id == match.id).first()
        return build_match_response(match)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/rounds/{round_id}/matches", response_model=List[MatchResponse])
def get_matches_for_round(
    round_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all matches for a round"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view matches"
        )
    
    try:
        matches = get_round_matches(db, round_id, current_user.id)
        match_responses = [build_match_response(match) for match in matches]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/matches", response_model=List[MatchResponse])
def get_matches_for_tournament(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all matches for a tournament"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view matches"
        )
    
    try:
        matches = get_tournament_matches(db, tournament_id, current_user.id)
        match_responses = [build_match_response(match) for match in matches]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/matches/{match_id}/toggle-publish", response_model=MatchResponse)
def toggle_match_publish(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
  
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can toggle match publish status"
        )
    
    try:
        match = toggle_match_published_status(db, match_id, current_user.id)
        # Reload with relationships
        match = db.query(Match).options(
            joinedload(Match.team_a),
            joinedload(Match.team_b),
            joinedload(Match.toss_winner),
            joinedload(Match.batting_team),
            joinedload(Match.bowling_team)
        ).filter(Match.id == match.id).first()
        return build_match_response(match)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/matches/published", response_model=List[MatchResponse])
def get_published_matches_for_tournament(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all published matches for a tournament (public endpoint for clubs and others)"""
    # This endpoint is accessible to any authenticated user
    current_user = get_current_user(request, db)
    
    try:
        matches = get_published_tournament_matches(db, tournament_id)
        match_responses = [build_match_response(match) for match in matches]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/rounds/{round_id}/matches/published", response_model=List[MatchResponse])
def get_published_matches_for_round(
    round_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all published matches for a round (public endpoint for clubs and others)"""
    # This endpoint is accessible to any authenticated user
    current_user = get_current_user(request, db)
    
    try:
        matches = get_published_round_matches(db, round_id)
        match_responses = [build_match_response(match) for match in matches]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

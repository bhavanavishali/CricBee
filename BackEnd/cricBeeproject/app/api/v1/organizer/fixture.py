from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.organizer.fixture import (
    FixtureRoundCreate,
    FixtureRoundResponse,
    MatchCreate,
    MatchUpdate,
    MatchResponse,
    FixtureRoundWithMatchesResponse
)
from app.services.organizer.fixture_service import (
    can_create_fixture,
    create_fixture_round,
    get_tournament_rounds,
    create_match,
    update_match_details,
    get_round_matches,
    get_tournament_matches,
    toggle_match_published_status,
    get_published_tournament_matches,
    get_published_round_matches,
    initialize_league_fixture_structure,
    generate_league_matches,
    calculate_league_standings,
    get_qualified_teams_for_playoff
)
from typing import List
from app.models.organizer.fixture import Match

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

def build_match_response(match: Match) -> MatchResponse:
  
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
    #Create a match
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create matches"
        )
    
    try:
        match = create_match(db, match_data, current_user.id)
        
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

@router.post("/tournaments/{tournament_id}/league/initialize", response_model=List[FixtureRoundResponse])
def initialize_league_fixtures(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #Initialize league fixture structure with 3 rounds
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can initialize league fixtures"
        )
    
    try:
        rounds = initialize_league_fixture_structure(db, tournament_id, current_user.id)
        return rounds
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/rounds/{round_id}/league/generate-matches", response_model=List[MatchResponse])
def generate_league_matches_endpoint(
    round_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #Generate league matches using Single Round-Robin algorithm
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can generate league matches"
        )
    
    try:
        matches = generate_league_matches(db, round_id, current_user.id)
        match_responses = [build_match_response(match) for match in matches]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/rounds/{round_id}/standings")
def get_league_standings(
    tournament_id: int,
    round_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #Get league standings for a round
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view league standings"
        )
    
    try:
        standings = calculate_league_standings(db, tournament_id, round_id, current_user.id)
        return {"standings": standings}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/tournaments/{tournament_id}/qualified-teams")
def get_qualified_teams(
    tournament_id: int,
    request: Request,
    top_n: int = Query(4, description="Number of top teams to qualify"),
    db: Session = Depends(get_db)
):
    #Get qualified teams for playoff based on league standings"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view qualified teams"
        )
    
    try:
        team_ids = get_qualified_teams_for_playoff(db, tournament_id, current_user.id, top_n)
        return {"qualified_team_ids": team_ids}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/matches/{match_id}/details", response_model=MatchResponse)
def update_match_details_endpoint(
    match_id: int,
    match_update: MatchUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    #Update match date, time, and venue. Teams cannot be changed.
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update match details"
        )
    
    try:
        match = update_match_details(db, match_id, match_update, current_user.id)
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

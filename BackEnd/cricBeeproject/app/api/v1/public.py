"""Public API endpoints - no authentication required"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.organizer.tournament import Tournament, TournamentDetails
from app.models.organizer.fixture import Match, FixtureRound
from app.models.organizer.match_score import MatchScore, BallByBall, PlayerMatchStats
from app.models.organizer.tournament import TournamentStatus
from app.models.user import User
from app.models.club import Club
# Import the service function directly - it returns the right format
from app.services.organizer.match_score_service import get_live_scoreboard
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/tournaments", response_model=List[dict])
def get_all_tournaments(
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None
):
   
    query = db.query(Tournament).options(
        joinedload(Tournament.organizer).joinedload(User.organization)
    ).filter(
        Tournament.status != TournamentStatus.CANCELLED.value
    )
    
    
    if status_filter:
        if status_filter == "ongoing":
            query = query.filter(Tournament.status == TournamentStatus.TOURNAMENT_START.value)
        elif status_filter == "upcoming":
            query = query.filter(
                Tournament.status.in_([
                    TournamentStatus.REGISTRATION_OPEN.value,
                    TournamentStatus.REGISTRATION_END.value
                ])
            )
        elif status_filter == "completed":
            query = query.filter(Tournament.status == TournamentStatus.TOURNAMENT_END.value)
    
    tournaments = query.all()
    
    result = []
    for tournament in tournaments:
        organizer_name = None
        if tournament.organizer and tournament.organizer.organization:
            organizer_name = tournament.organizer.organization.organization_name
        
        # Determine status badge
        status_badge = "upcoming"
        if tournament.status == TournamentStatus.TOURNAMENT_START.value:
            status_badge = "ongoing"
        elif tournament.status == TournamentStatus.TOURNAMENT_END.value:
            status_badge = "completed"
        
        result.append({
            "id": tournament.id,
            "tournament_name": tournament.tournament_name,
            "organizer_name": organizer_name,
            "location": tournament.details.location if tournament.details else None,
            "start_date": tournament.details.start_date.isoformat() if tournament.details and tournament.details.start_date else None,
            "end_date": tournament.details.end_date.isoformat() if tournament.details and tournament.details.end_date else None,
            "status": tournament.status,
            "status_badge": status_badge,
            "is_verified": tournament.organizer.is_verified if tournament.organizer else False,
            "is_premium": tournament.plan_id is not None,
            "is_blocked": tournament.is_blocked
        })
    
    return result

@router.get("/tournaments/{tournament_id}", response_model=dict)
def get_tournament_details(
    tournament_id: int,
    db: Session = Depends(get_db)
):
   
    tournament = db.query(Tournament).options(
        joinedload(Tournament.organizer).joinedload(User.organization),
        joinedload(Tournament.details)
    ).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    if tournament.status == TournamentStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    organizer_name = None
    is_verified = False
    if tournament.organizer:
        is_verified = tournament.organizer.is_verified
        if tournament.organizer.organization:
            organizer_name = tournament.organizer.organization.organization_name
    
    # Get all matches for this tournament
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round)
    ).filter(Match.tournament_id == tournament_id).order_by(
        Match.match_date.asc(),
        Match.match_time.asc()
    ).all()
    
    match_list = []
    for match in matches:
        # Determine match status
        match_status = "scheduled"
        if match.match_status == "toss_completed":
            match_status = "toss_completed"
        elif match.match_status == "live":
            match_status = "live"
        elif match.match_status == "completed":
            match_status = "completed"
        elif match.toss_winner_id:
            match_status = "toss_completed"
        
        match_list.append({
            "id": match.id,
            "team_a_name": match.team_a.club_name if match.team_a else None,
            "team_b_name": match.team_b.club_name if match.team_b else None,
            "match_date": match.match_date.isoformat() if match.match_date else None,
            "match_time": match.match_time.strftime("%H:%M") if match.match_time else None,
            "venue": match.venue,
            "status": match.match_status,
            "status_badge": match_status,
            "round_name": match.round.round_name if match.round else None
        })
    
    return {
        "id": tournament.id,
        "tournament_name": tournament.tournament_name,
        "organizer_name": organizer_name,
        "is_verified": is_verified,
        "is_premium": tournament.plan_id is not None,
        "is_blocked": tournament.is_blocked,
        "location": tournament.details.location if tournament.details else None,
        "start_date": tournament.details.start_date.isoformat() if tournament.details and tournament.details.start_date else None,
        "end_date": tournament.details.end_date.isoformat() if tournament.details and tournament.details.end_date else None,
        "venue_details": tournament.details.venue_details if tournament.details else None,
        "overs": tournament.details.overs if tournament.details else None,
        "team_range": tournament.details.team_range if tournament.details else None,
        "enrollment_fee": float(tournament.details.enrollment_fee) if tournament.details and tournament.details.enrollment_fee else 0.0,
        "matches": match_list
    }

@router.get("/matches/{match_id}/scoreboard")
def get_public_scoreboard(
    match_id: int,
    db: Session = Depends(get_db)
):
    
    try:
        scoreboard = get_live_scoreboard(db, match_id)
        return scoreboard
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/matches/live", response_model=List[dict])
def get_live_matches(
    db: Session = Depends(get_db)
):
  
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.tournament)
    ).filter(
        Match.match_status == "live"
    ).order_by(Match.match_date.desc(), Match.match_time.desc()).all()
    
    result = []
    for match in matches:
        # Get batting score
        batting_score = db.query(MatchScore).filter(
            MatchScore.match_id == match.id,
            MatchScore.team_id == match.batting_team_id
        ).first()
        
        result.append({
            "id": match.id,
            "team_a_name": match.team_a.club_name if match.team_a else None,
            "team_b_name": match.team_b.club_name if match.team_b else None,
            "batting_team_name": match.batting_team.club_name if match.batting_team else None,
            "score": f"{batting_score.runs}/{batting_score.wickets}" if batting_score else "0/0",
            "overs": float(batting_score.overs) if batting_score else 0.0,
            "tournament_name": match.tournament.tournament_name if match.tournament else None,
            "venue": match.venue,
            "match_date": match.match_date.isoformat() if match.match_date else None,
            "match_time": match.match_time.strftime("%H:%M") if match.match_time else None
        })
    
    return result


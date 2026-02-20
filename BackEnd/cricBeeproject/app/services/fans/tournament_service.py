"""Tournament service for fans - public tournament viewing"""
from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentStatus
from app.models.user import User
from typing import List, Optional, Dict, Any


def get_all_tournaments_for_fans(
    db: Session,
    status_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    
    try:
        query = db.query(Tournament).options(
            joinedload(Tournament.organizer).joinedload(User.organization),
            joinedload(Tournament.details)
        ).filter(
            Tournament.status != TournamentStatus.CANCELLED.value
        )
        
        # Apply status filter
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
        
        tournaments = query.order_by(Tournament.created_at.desc()).all()
        
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
                "is_blocked": tournament.is_blocked,
                "team_range": tournament.details.team_range if tournament.details else None,
                "tournament_type": None,
                "created_at": tournament.created_at.isoformat() if tournament.created_at else None
            })
        
        return result
    except Exception as e:
        import logging
        logging.error(f"Error fetching tournaments for fans: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def get_tournament_details_for_fans(
    db: Session,
    tournament_id: int
) -> Dict[str, Any]:
    
    from app.models.organizer.fixture import Match
    from app.models.club import Club
    
    tournament = db.query(Tournament).options(
        joinedload(Tournament.organizer).joinedload(User.organization),
        joinedload(Tournament.details)
    ).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise ValueError("Tournament not found")
    
    if tournament.status == TournamentStatus.CANCELLED.value:
        raise ValueError("Tournament not found")
    
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
        # Determine match status badge
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
            "round_name": match.round.round_name if match.round else None,
            "streaming_url": match.streaming_url
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


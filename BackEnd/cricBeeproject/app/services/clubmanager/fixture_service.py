from sqlalchemy.orm import Session, joinedload
from app.models.organizer.fixture import Match
from app.models.organizer.tournament import TournamentEnrollment
from app.models.club import Club
from typing import List

def get_club_manager_matches(
    db: Session,
    club_id: int,
    manager_id: int
) -> List[Match]:
    #Get all published matches for tournaments where the club is enrolled
    
    # Verify club belongs to manager
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
    # Get all tournament enrollments for this club
    enrollments = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.club_id == club_id,
        TournamentEnrollment.payment_status == "success"
    ).all()
    
    tournament_ids = [enrollment.tournament_id for enrollment in enrollments]
    
    if not tournament_ids:
        return []
    
    # Get all published matches where club is either team_a or team_b
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round),
        joinedload(Match.tournament)
    ).filter(
        Match.tournament_id.in_(tournament_ids),
        Match.is_fixture_published == True,
        (Match.team_a_id == club_id) | (Match.team_b_id == club_id)
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches


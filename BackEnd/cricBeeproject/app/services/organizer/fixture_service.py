from sqlalchemy.orm import Session, joinedload
from datetime import date
from app.models.organizer.fixture import FixtureRound, Match
from app.models.organizer.tournament import Tournament
from app.models.club import Club
from app.schemas.organizer.fixture import FixtureRoundCreate, MatchCreate
from typing import List

def can_create_fixture(db: Session, tournament_id: int, organizer_id: int) -> tuple[bool, str]:
    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        return False, "Tournament not found or access denied"
    
    if not tournament.details:
        return False, "Tournament details not found"
    
    today = date.today()
    registration_end_date = tournament.details.registration_end_date
    
    if today <= registration_end_date:
        return False, f"Fixture creation is only available after registration deadline ({registration_end_date})"
    
    return True, ""

def create_fixture_round(
    db: Session,
    round_data: FixtureRoundCreate,
    organizer_id: int
) -> FixtureRound:
   
    tournament = db.query(Tournament).filter(
        Tournament.id == round_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if fixture creation is allowed
    can_create, message = can_create_fixture(db, round_data.tournament_id, organizer_id)
    if not can_create:
        raise ValueError(message)
    
    # Create the round
    fixture_round = FixtureRound(
        tournament_id=round_data.tournament_id,
        round_name=round_data.round_name,
        number_of_matches=round_data.number_of_matches
    )
    
    db.add(fixture_round)
    db.commit()
    db.refresh(fixture_round)
    
    return fixture_round

def get_tournament_rounds(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[FixtureRound]:
   
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    rounds = db.query(FixtureRound).filter(
        FixtureRound.tournament_id == tournament_id
    ).order_by(FixtureRound.created_at.asc()).all()
    
    return rounds

def create_match(
    db: Session,
    match_data: MatchCreate,
    organizer_id: int
) -> Match:

    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Verify round exists and belongs to tournament
    round = db.query(FixtureRound).filter(
        FixtureRound.id == match_data.round_id,
        FixtureRound.tournament_id == match_data.tournament_id
    ).first()
    
    if not round:
        raise ValueError("Round not found or does not belong to this tournament")
    
    # Verify teams exist
    team_a = db.query(Club).filter(Club.id == match_data.team_a_id).first()
    team_b = db.query(Club).filter(Club.id == match_data.team_b_id).first()
    
    if not team_a or not team_b:
        raise ValueError("One or both teams not found")
    
    if match_data.team_a_id == match_data.team_b_id:
        raise ValueError("Team A and Team B cannot be the same")
    
 
    match = Match(
        round_id=match_data.round_id,
        tournament_id=match_data.tournament_id,
        match_number=match_data.match_number,
        team_a_id=match_data.team_a_id,
        team_b_id=match_data.team_b_id,
        match_date=match_data.match_date,
        match_time=match_data.match_time,
        venue=match_data.venue
    )
    
    db.add(match)
    db.commit()
    db.refresh(match)
    
    return match

def get_round_matches(
    db: Session,
    round_id: int,
    organizer_id: int
) -> List[Match]:
   
    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")
    
    
    tournament = db.query(Tournament).filter(
        Tournament.id == round.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def get_tournament_matches(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[Match]:

    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round)
    ).filter(
        Match.tournament_id == tournament_id
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def toggle_match_published_status(
    db: Session,
    match_id: int,
    organizer_id: int
) -> Match:
    
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Toggle published status
    match.is_published = not match.is_published
    db.commit()
    db.refresh(match)
    
    return match

def get_published_tournament_matches(
    db: Session,
    tournament_id: int
) -> List[Match]:
   
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round)
    ).filter(
        Match.tournament_id == tournament_id,
        Match.is_published == True
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def get_published_round_matches(
    db: Session,
    round_id: int
) -> List[Match]:
    """Get all published matches for a round (public endpoint)"""
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id,
        Match.is_published == True
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches


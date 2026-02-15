from sqlalchemy.orm import Session
from app.models.organizer.fixture import Match
from app.models.organizer.round_two_clubs import RoundTwoClub
from app.models.organizer.tournament import Tournament
from typing import Dict, List

def check_round_completion(db: Session, round_id: int, tournament_id: int = None) -> Dict:
  
    
    query = db.query(Match).filter(Match.round_id == round_id)
    if tournament_id:
        query = query.filter(Match.tournament_id == tournament_id)
    
    matches = query.all()
    
   
    
    if not matches:
        return {
            "is_complete": False,
            "total_matches": 0,
            "completed_matches": 0,
            "message": "No matches found in this round"
        }
    
    total_matches = len(matches)
    completed_matches = len([m for m in matches if m.match_status == 'completed'])
    
    
    
    is_complete = total_matches > 0 and completed_matches == total_matches
    
    return {
        "is_complete": is_complete,
        "total_matches": total_matches,
        "completed_matches": completed_matches,
        "message": f"{completed_matches}/{total_matches} matches completed"
    }

def add_club_to_round_two(
    db: Session,
    tournament_id: int,
    club_id: int,
    organizer_id: int
) -> RoundTwoClub:
    
    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if club already added
    existing = db.query(RoundTwoClub).filter(
        RoundTwoClub.tournament_id == tournament_id,
        RoundTwoClub.club_id == club_id
    ).first()
    
    if existing:
        raise ValueError("Club already added to Round 2")
    
    # Add club to Round 2
    round_two_club = RoundTwoClub(
        tournament_id=tournament_id,
        club_id=club_id,
        added_by=organizer_id
    )
    db.add(round_two_club)
    db.commit()
    db.refresh(round_two_club)
    
    return round_two_club

def remove_club_from_round_two(
    db: Session,
    tournament_id: int,
    club_id: int,
    organizer_id: int
) -> Dict:
    """
    Remove a club from Round 2 selection.
    """
    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Find and delete the entry
    round_two_club = db.query(RoundTwoClub).filter(
        RoundTwoClub.tournament_id == tournament_id,
        RoundTwoClub.club_id == club_id
    ).first()
    
    if not round_two_club:
        raise ValueError("Club not found in Round 2 selection")
    
    db.delete(round_two_club)
    db.commit()
    
    return {"message": "Club removed from Round 2 successfully"}

def get_round_two_clubs(db: Session, tournament_id: int) -> List[int]:
    """
    Get list of club IDs selected for Round 2.
    """
    round_two_clubs = db.query(RoundTwoClub).filter(
        RoundTwoClub.tournament_id == tournament_id
    ).all()
    
    return [club.club_id for club in round_two_clubs]

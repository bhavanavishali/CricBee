from sqlalchemy.orm import Session
from app.models.organizer.round_progression import RoundProgression
from app.models.organizer.tournament import Tournament, TournamentStatus
from typing import Dict, List

def save_qualified_teams(
    db: Session,
    tournament_id: int,
    from_round: str,
    to_round: str,
    club_ids: List[int],
    organizer_id: int
) -> Dict:
    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found")
    
    
    organizer_id = tournament.organizer_id
    
    # Delete existing entries for this progression (in case of re-selection)
    db.query(RoundProgression).filter(
        RoundProgression.tournament_id == tournament_id,
        RoundProgression.from_round == from_round,
        RoundProgression.to_round == to_round
    ).delete()
    
    # Add new qualified teams
    qualified_teams = []
    for club_id in club_ids:
        progression = RoundProgression(
            tournament_id=tournament_id,
            from_round=from_round,
            to_round=to_round,
            club_id=club_id,
            added_by=organizer_id
        )
        db.add(progression)
        qualified_teams.append(progression)
    
    db.commit()
    
    return {
        "message": f"Successfully saved {len(club_ids)} qualified teams for {to_round}",
        "tournament_id": tournament_id,
        "from_round": from_round,
        "to_round": to_round,
        "qualified_count": len(club_ids)
    }

def get_qualified_teams(
    db: Session,
    tournament_id: int,
    from_round: str,
    to_round: str
) -> List[int]:
   
    progressions = db.query(RoundProgression).filter(
        RoundProgression.tournament_id == tournament_id,
        RoundProgression.from_round == from_round,
        RoundProgression.to_round == to_round
    ).all()
    
    return [p.club_id for p in progressions]

def get_all_qualified_teams_for_round(
    db: Session,
    tournament_id: int,
    to_round: str
) -> List[int]:
   
    progressions = db.query(RoundProgression).filter(
        RoundProgression.tournament_id == tournament_id,
        RoundProgression.to_round == to_round
    ).all()
    
    return [p.club_id for p in progressions]

def complete_tournament_with_winner(
    db: Session,
    tournament_id: int,
    winner_team_id: int,
    organizer_id: int
) -> Dict:
    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found")
    
    
    from app.models.club import Club
    winner_team = db.query(Club).filter(Club.id == winner_team_id).first()
    
    if not winner_team:
        raise ValueError("Winner team not found")
    
    
    tournament.winner_team_id = winner_team_id
    tournament.status = TournamentStatus.COMPLETED.value
    
    
    db.commit()
    db.refresh(tournament)
    
    from sqlalchemy import text
    result = db.execute(text("SELECT status, winner_team_id FROM tournaments WHERE id = :tournament_id"), {"tournament_id": tournament_id})
    db_status = result.fetchone()
    
    return {
        "message": "Tournament completed successfully",
        "tournament_id": tournament_id,
        "tournament_name": tournament.tournament_name,
        "winner_team_id": winner_team_id,
        "winner_team_name": winner_team.club_name,
        "status": tournament.status
    }

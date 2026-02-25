
from sqlalchemy.orm import Session, joinedload
from app.models.organizer.fixture import Match
from app.models.organizer.match_score import MatchScore
from app.services.organizer.match_score_service import get_live_scoreboard
from typing import List, Dict, Any


def get_live_matches_for_fans(db: Session) -> List[Dict[str, Any]]:
  
    try:
        matches = db.query(Match).options(
            joinedload(Match.team_a),
            joinedload(Match.team_b),
            joinedload(Match.tournament),
            joinedload(Match.batting_team)
        ).filter(
            Match.match_status == "live"
        ).order_by(Match.match_date.desc(), Match.match_time.desc()).all()
        
        result = []
        for match in matches:
            # Get current batting score
            batting_score = None
            if match.batting_team_id:
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
                "overs": float(batting_score.overs) if batting_score and batting_score.overs else 0.0,
                "tournament_name": match.tournament.tournament_name if match.tournament else None,
                "venue": match.venue or "",
                "match_date": match.match_date.isoformat() if match.match_date else None,
                "match_time": match.match_time.strftime("%H:%M") if match.match_time else None
            })
        
        return result
    except Exception as e:
        import logging
        logging.error(f"Error fetching live matches for fans: {str(e)}")
        return []


def get_match_scoreboard_for_fans(db: Session, match_id: int) -> Dict[str, Any]:
   
    try:
        scoreboard = get_live_scoreboard(db, match_id)
        return scoreboard
    except ValueError as e:
        raise ValueError(str(e))


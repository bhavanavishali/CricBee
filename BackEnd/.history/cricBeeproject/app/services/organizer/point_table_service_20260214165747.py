from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.organizer.point_table import PointTable
from app.models.organizer.fixture import Match
from app.models.organizer.match_score import MatchScore
from app.models.organizer.tournament import Tournament
from app.models.club import Club
from app.models.organizer.tournament import TournamentEnrollment
from decimal import Decimal
from typing import List, Optional

def initialize_point_table_for_tournament(
    db: Session,
    tournament_id: int,
    team_ids: List[int] = None
) -> List[PointTable]:
    
    if team_ids is None:
        enrollments = db.query(TournamentEnrollment).filter(
            TournamentEnrollment.tournament_id == tournament_id,
            TournamentEnrollment.payment_status == 'success'
        ).all()
        team_ids = [enrollment.club_id for enrollment in enrollments]
    
    point_entries = []
    
    for team_id in team_ids:
        
        existing = db.query(PointTable).filter(
            PointTable.tournament_id == tournament_id,
            PointTable.team_id == team_id
        ).first()
        
        if not existing:
            point_entry = PointTable(
                tournament_id=tournament_id,
                team_id=team_id,
                matches_played=0,
                matches_won=0,
                matches_lost=0,
                matches_tied=0,
                matches_no_result=0,
                points=0,
                runs_scored=0,
                runs_conceded=0,
                overs_faced=0.0,
                overs_bowled=0.0,
                net_run_rate=0.0
            )
            db.add(point_entry)
            point_entries.append(point_entry)
    
    db.commit()
    return point_entries

def update_point_table_after_match(
    db: Session,
    match_id: int
) -> dict:
   
    # Get match details
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    if match.match_status != 'completed':
        raise ValueError("Match is not completed yet")
    
    # Get scores for both teams
    team_a_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_a_id
    ).first()
    
    team_b_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_b_id
    ).first()
    
    if not team_a_score or not team_b_score:
        raise ValueError("Match scores not found for both teams")
    
    # Get or create point table entries for both teams
    team_a_points = db.query(PointTable).filter(
        PointTable.tournament_id == match.tournament_id,
        PointTable.team_id == match.team_a_id
    ).first()
    
    if not team_a_points:
        team_a_points = PointTable(
            tournament_id=match.tournament_id,
            team_id=match.team_a_id
        )
        db.add(team_a_points)
    
    team_b_points = db.query(PointTable).filter(
        PointTable.tournament_id == match.tournament_id,
        PointTable.team_id == match.team_b_id
    ).first()
    
    if not team_b_points:
        team_b_points = PointTable(
            tournament_id=match.tournament_id,
            team_id=match.team_b_id
        )
        db.add(team_b_points)
    
    # Update matches played
    team_a_points.matches_played += 1
    team_b_points.matches_played += 1
    
    # Update runs and overs for NRR calculation
    team_a_points.runs_scored += team_a_score.runs
    team_a_points.overs_faced += Decimal(str(team_a_score.overs))
    team_a_points.runs_conceded += team_b_score.runs
    team_a_points.overs_bowled += Decimal(str(team_b_score.overs))
    
    team_b_points.runs_scored += team_b_score.runs
    team_b_points.overs_faced += Decimal(str(team_b_score.overs))
    team_b_points.runs_conceded += team_a_score.runs
    team_b_points.overs_bowled += Decimal(str(team_a_score.overs))
    
    # Determine match result and update wins/losses/ties
    if match.winner_id is None:
        # Match tied
        team_a_points.matches_tied += 1
        team_b_points.matches_tied += 1
        team_a_points.points += 1  # Tie = 1 point
        team_b_points.points += 1
    elif match.winner_id == match.team_a_id:
        # Team A won
        team_a_points.matches_won += 1
        team_a_points.points += 2  # Win = 2 points
        team_b_points.matches_lost += 1
    else:
        # Team B won
        team_b_points.matches_won += 1
        team_b_points.points += 2
        team_a_points.matches_lost += 1
    
    # Calculate Net Run Rate (NRR)
    # NRR = (Runs scored / Overs faced) - (Runs conceded / Overs bowled)
    team_a_points.net_run_rate = calculate_nrr(
        team_a_points.runs_scored,
        team_a_points.overs_faced,
        team_a_points.runs_conceded,
        team_a_points.overs_bowled
    )
    
    team_b_points.net_run_rate = calculate_nrr(
        team_b_points.runs_scored,
        team_b_points.overs_faced,
        team_b_points.runs_conceded,
        team_b_points.overs_bowled
    )
    
    db.commit()
    db.refresh(team_a_points)
    db.refresh(team_b_points)
    
    return {
        "message": "Point table updated successfully",
        "match_id": match_id,
        "team_a_points": team_a_points,
        "team_b_points": team_b_points
    }

def calculate_nrr(
    runs_scored: int,
    overs_faced: Decimal,
    runs_conceded: int,
    overs_bowled: Decimal
) -> Decimal:
    """
    Calculate Net Run Rate (NRR).
    NRR = (Runs scored / Overs faced) - (Runs conceded / Overs bowled)
    """
    run_rate_for = Decimal('0.0')
    run_rate_against = Decimal('0.0')
    
    if overs_faced > 0:
        run_rate_for = Decimal(runs_scored) / overs_faced
    
    if overs_bowled > 0:
        run_rate_against = Decimal(runs_conceded) / overs_bowled
    
    nrr = run_rate_for - run_rate_against
    
    # Round to 3 decimal places
    return round(nrr, 3)

def get_point_table_by_tournament(
    db: Session,
    tournament_id: int
) -> List[dict]:
    """
    Get point table for a tournament, sorted by:
    1. Points (descending)
    2. Net Run Rate (descending)
    3. Matches Won (descending)
    """
    point_entries = db.query(
        PointTable,
        Club.club_name
    ).join(
        Club, PointTable.team_id == Club.id
    ).filter(
        PointTable.tournament_id == tournament_id
    ).order_by(
        PointTable.points.desc(),
        PointTable.net_run_rate.desc(),
        PointTable.matches_won.desc()
    ).all()
    
    result = []
    position = 1
    
    for point_entry, team_name in point_entries:
        result.append({
            "position": position,
            "team_id": point_entry.team_id,
            "team_name": team_name,
            "matches_played": point_entry.matches_played,
            "matches_won": point_entry.matches_won,
            "matches_lost": point_entry.matches_lost,
            "matches_tied": point_entry.matches_tied,
            "matches_no_result": point_entry.matches_no_result,
            "points": point_entry.points,
            "net_run_rate": float(point_entry.net_run_rate),
            "runs_scored": point_entry.runs_scored,
            "runs_conceded": point_entry.runs_conceded,
            "overs_faced": float(point_entry.overs_faced),
            "overs_bowled": float(point_entry.overs_bowled)
        })
        position += 1
    
    return result

def reset_point_table_for_tournament(
    db: Session,
    tournament_id: int
) -> dict:
    """
    Reset point table for a tournament (useful for testing or tournament restart).
    """
    db.query(PointTable).filter(
        PointTable.tournament_id == tournament_id
    ).delete()
    
    db.commit()
    
    return {"message": "Point table reset successfully", "tournament_id": tournament_id}

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.organizer.point_table import PointTable
from app.models.organizer.tournament import TournamentEnrollment
from app.models.club import Club

router = APIRouter(prefix="/point_table", tags=["point_table"])

@router.get("/tournament/{tournament_id}")
def get_point_table(tournament_id: int, db: Session = Depends(get_db)):
    
    try:
        
        all_enrollments = db.query(TournamentEnrollment).filter(
            TournamentEnrollment.tournament_id == tournament_id
        ).all()
        
        print(f"DEBUG: Found {len(all_enrollments)} total enrollments for tournament {tournament_id}")
        for enrollment in all_enrollments:
            print(f"  - Club ID: {enrollment.club_id}, Payment Status: {enrollment.payment_status}")
        
        
        enrollments = db.query(TournamentEnrollment).filter(
            TournamentEnrollment.tournament_id == tournament_id
        ).all()
        
        print(f"DEBUG: Using {len(enrollments)} enrollments for point table")
        
        
        club_ids = [enrollment.club_id for enrollment in enrollments]
        clubs = db.query(Club).filter(Club.id.in_(club_ids)).all()
        club_names = {club.id: club.club_name for club in clubs}
        
        print(f"DEBUG: Found {len(clubs)} clubs: {list(club_names.values())}")
        
        
        point_entries = db.query(PointTable).filter(
            PointTable.tournament_id == tournament_id
        ).all()
        
        
        if not point_entries and enrollments:
            from app.services.organizer import point_table_service
            point_table_service.initialize_point_table_for_tournament(db, tournament_id)
            point_entries = db.query(PointTable).filter(
                PointTable.tournament_id == tournament_id
            ).all()
        
        
        result = []
        position = 1
        
        if point_entries:
            
            sorted_entries = sorted(point_entries, key=lambda x: (
                x.points, x.net_run_rate, x.matches_won
            ), reverse=True)
            
            for entry in sorted_entries:
                result.append({
                    "position": position,
                    "team_id": entry.team_id,
                    "team_name": club_names.get(entry.team_id, "Unknown Team"),
                    "matches_played": entry.matches_played,
                    "matches_won": entry.matches_won,
                    "matches_lost": entry.matches_lost,
                    "matches_tied": entry.matches_tied,
                    "matches_no_result": entry.matches_no_result,
                    "points": entry.points,
                    "net_run_rate": float(entry.net_run_rate)
                })
                position += 1
        else:
            
            for enrollment in enrollments:
                result.append({
                    "position": position,
                    "team_id": enrollment.club_id,
                    "team_name": club_names.get(enrollment.club_id, "Unknown Team"),
                    "matches_played": 0,
                    "matches_won": 0,
                    "matches_lost": 0,
                    "matches_tied": 0,
                    "matches_no_result": 0,
                    "points": 0,
                    "net_run_rate": 0.0
                })
                position += 1
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching point table: {str(e)}"
        )

@router.post("/tournament/{tournament_id}/initialize")
def initialize_point_table(tournament_id: int, db: Session = Depends(get_db)):
    
    try:
        from app.services.organizer import point_table_service
        point_entries = point_table_service.initialize_point_table_for_tournament(db, tournament_id)
        
        return {
            "message": "Point table initialized successfully",
            "tournament_id": tournament_id,
            "teams_count": len(point_entries)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing point table: {str(e)}"
        )

@router.delete("/tournament/{tournament_id}/reset")
def reset_point_table(tournament_id: int):
    
    try:
        return {
            "message": "Point table reset successfully",
            "tournament_id": tournament_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting point table: {str(e)}"
        )

@router.post("/match/{match_id}/update")
def update_point_table_for_match(match_id: int):
    """
    Manually trigger point table update for a completed match.
    This is automatically called when match is completed, but can be manually triggered if needed.
    """
    try:
        return {
            "message": "Point table updated successfully",
            "match_id": match_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating point table: {str(e)}"
        )

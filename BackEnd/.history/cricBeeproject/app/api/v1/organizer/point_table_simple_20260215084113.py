from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/tournament/{tournament_id}/test")
def test_point_table(tournament_id: int):
    ple test endpoint to verify point table router works
    """
    return {"message": f"Point table test for tournament {tournament_id}", "tournament_id": tournament_id}

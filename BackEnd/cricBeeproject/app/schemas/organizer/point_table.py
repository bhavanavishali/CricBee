from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PointTableBase(BaseModel):
    tournament_id: int
    team_id: int
    matches_played: int = 0
    matches_won: int = 0
    matches_lost: int = 0
    matches_tied: int = 0
    matches_no_result: int = 0
    points: int = 0
    net_run_rate: float = 0.0

class PointTableCreate(BaseModel):
    tournament_id: int
    team_id: int

class PointTableResponse(BaseModel):
    position: int
    team_id: int
    team_name: str
    matches_played: int
    matches_won: int
    matches_lost: int
    matches_tied: int
    matches_no_result: int
    points: int
    net_run_rate: float
    runs_scored: Optional[int] = 0
    runs_conceded: Optional[int] = 0
    overs_faced: Optional[float] = 0.0
    overs_bowled: Optional[float] = 0.0
    
    class Config:
        from_attributes = True

class PointTableListResponse(BaseModel):
    tournament_id: int
    tournament_name: str
    point_table: list[PointTableResponse]
    
    class Config:
        from_attributes = True

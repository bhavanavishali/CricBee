from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime

class FixtureRoundCreate(BaseModel):
    tournament_id: int
    round_name: str = Field(..., min_length=1, max_length=100)
    number_of_matches: int = Field(..., gt=0)

class FixtureRoundResponse(BaseModel):
    id: int
    tournament_id: int
    round_name: str
    number_of_matches: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MatchCreate(BaseModel):
    round_id: int
    tournament_id: int
    match_number: str = Field(..., min_length=1, max_length=50)
    team_a_id: int
    team_b_id: int
    match_date: date
    match_time: time
    venue: str = Field(..., min_length=1, max_length=200)

class MatchResponse(BaseModel):
    id: int
    round_id: int
    tournament_id: int
    match_number: str
    team_a_id: int
    team_a_name: Optional[str] = None
    team_b_id: int
    team_b_name: Optional[str] = None
    match_date: date
    match_time: time
    venue: str
    is_published: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FixtureRoundWithMatchesResponse(BaseModel):
    id: int
    tournament_id: int
    round_name: str
    number_of_matches: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    matches: List[MatchResponse] = []
    
    class Config:
        from_attributes = True


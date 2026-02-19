# app/schemas/player.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from app.schemas.user import UserRead 

class PlayerCreate(BaseModel):
    age: int
    address: str

class PlayerUpdate(BaseModel):
    age: Optional[int] = None
    address: Optional[str] = None

class PlayerRead(BaseModel):
    id: int
    age: int
    address: str
    cricb_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 

class PlayerProfileResponse(BaseModel):
    user: UserRead
    player_profile: Optional[PlayerRead] = None

# Player Dashboard Schemas
class PlayerDashboardClub(BaseModel):
    id: int
    club_name: str
    short_name: str
    location: str
    club_image: Optional[str] = None
    joined_at: datetime
    
    class Config:
        from_attributes = True

class PlayerDashboardTournament(BaseModel):
    id: int
    tournament_name: str
    status: str
    start_date: date
    end_date: date
    location: str
    overs: int
    enrollment_status: str
    
    class Config:
        from_attributes = True

class PlayerDashboardMatch(BaseModel):
    id: int
    match_number: str
    tournament_name: str
    opponent_name: str
    opponent_id: int
    match_date: date
    match_time: time
    venue: str
    match_status: str
    round_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class PlayerDashboardResponse(BaseModel):
    club: Optional[PlayerDashboardClub] = None
    tournaments: List[PlayerDashboardTournament] = []
    matches: List[PlayerDashboardMatch] = []
    stats: dict = {
        "total_tournaments": 0,
        "upcoming_matches": 0,
        "completed_matches": 0
    }
# app/schemas/club.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserRead  # Assuming UserRead exists as per provided code

class ClubCreate(BaseModel):
    club_name: str
    description: str
    short_name: str
    location: str

class ClubUpdate(BaseModel):
    club_name: Optional[str] = None
    description: Optional[str] = None
    short_name: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class ClubRead(BaseModel):
    id: int
    club_name: str
    description: str
    short_name: str
    location: str
    is_active: bool
    no_of_players: int
    created_at: datetime
    created_at: datetime | None = None
    updated_at: datetime | None = None

    

    class Config:
        from_attributes = True  # For Pydantic v1; use model_config = {"from_attributes": True} for v2

class ClubProfileResponse(BaseModel):
    user: UserRead
    club: Optional[ClubRead] = None
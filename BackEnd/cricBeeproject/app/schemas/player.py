# app/schemas/player.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
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
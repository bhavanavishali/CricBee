# app/schemas/club.py
from __future__ import annotations

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserRead, UserUpdate
from app.schemas.player import PlayerRead

class ClubCreate(BaseModel):
    club_name: str
    description: str
    short_name: str
    location: str
    club_image: Optional[str] = None

class ClubUpdate(BaseModel):
    club_name: Optional[str] = None
    description: Optional[str] = None
    short_name: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None
    club_image: Optional[str] = None

class ClubRead(BaseModel):
    id: int
    club_name: str
    description: str
    short_name: str
    location: str
    is_active: bool
    no_of_players: int
    club_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True 



class ClubProfileResponse(BaseModel):
    user: UserRead
    club: Optional[ClubRead] = None

class ClubProfileUpdate(BaseModel):
    user: Optional[UserUpdate] = None
    club: Optional[ClubUpdate] = None

# ---------   Club Profile Response Schema-----------------

class PlayerSearchResponse(BaseModel):
    
    player_profile: PlayerRead
    user: UserRead
    is_already_in_club: bool = False
    has_pending_invitation: bool = False  

class AddPlayerRequest(BaseModel):
    
    cricb_id: str

class ClubPlayerResponse(BaseModel):
    
    id: int
    player_profile: PlayerRead
    user: UserRead
    joined_at: datetime

class ClubPlayersListResponse(BaseModel):
    
    players: list[ClubPlayerResponse]
    total: int

# ---------   Club Player Invitation Schemas-----------------

class ClubPlayerInvitationResponse(BaseModel):
    id: int
    club: ClubRead
    player_profile: PlayerRead
    user: UserRead
    status: str
    requested_at: datetime
    responded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ClubPlayerInvitationListResponse(BaseModel):
    invitations: list[ClubPlayerInvitationResponse]
    total: int

class InvitationResponseRequest(BaseModel):
    invitation_id: int
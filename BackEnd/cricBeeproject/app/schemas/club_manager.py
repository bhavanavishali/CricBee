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
    is_already_in_any_club: bool = False
    current_club: Optional[ClubRead] = None
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

# Transaction and Wallet Schemas
class ClubManagerTransactionResponse(BaseModel):
    id: int
    transaction_id: str
    transaction_type: str
    transaction_direction: str
    amount: float
    status: str
    tournament_id: Optional[int] = None
    tournament_name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    payment_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ClubManagerWalletBalanceResponse(BaseModel):
    balance: float
    total_transactions: int

class ClubManagerTransactionListResponse(BaseModel):
    transactions: list[ClubManagerTransactionResponse]
    total: int

# Player Creation Schemas
class CreatePlayerRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    age: int
    address: str

class CreatePlayerResponse(BaseModel):
    player_profile: PlayerRead
    user: UserRead
    club_player: ClubPlayerResponse
    message: str
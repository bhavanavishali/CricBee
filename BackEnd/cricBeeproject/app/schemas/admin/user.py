from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


class UserListItem(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    organization_name: Optional[str] = None
    club_name: Optional[str] = None

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserStats(BaseModel):
    total_users: int
    total_active: int
    total_inactive: int
    total_organizers: int
    total_clubs: int


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int
    skip: int
    limit: int
    stats: UserStats


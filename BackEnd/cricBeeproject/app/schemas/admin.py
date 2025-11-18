from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserListItem(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime  # You'll need to add this field to your User model
    
    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool


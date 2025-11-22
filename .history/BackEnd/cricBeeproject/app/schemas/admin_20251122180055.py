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
    created_at: datetime  
    
    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool


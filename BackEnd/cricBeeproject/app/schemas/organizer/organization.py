# app/schemas/organizer/organization.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserRead, UserUpdate  

class OrganizationCreate(BaseModel):
    organization_name: str
    location: str
    bio: str
    organization_image: Optional[str] = None


class OrganizationUpdate(BaseModel):
    organization_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    active: Optional[bool] = None
    organization_image: Optional[str] = None


class OrganizationRead(BaseModel):
    id: int
    organization_name: str
    organization_image: Optional[str] = None
    location: str
    bio: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True 

class ProfileResponse(BaseModel):
    user: UserRead
    organization: Optional[OrganizationRead] = None


class ProfileUpdate(BaseModel):
    user: Optional[UserUpdate] = None
    organization: Optional[OrganizationUpdate] = None



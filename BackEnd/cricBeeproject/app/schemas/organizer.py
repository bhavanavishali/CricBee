# app/schemas/organizer.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserRead  # Assuming UserRead exists as per provided code

class OrganizationCreate(BaseModel):
    organization_name: str
    location: str
    bio: str

class OrganizationUpdate(BaseModel):
    organization_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    active: Optional[bool] = None

class OrganizationRead(BaseModel):
    id: int
    organization_name: str
    location: str
    bio: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # For Pydantic v1; use model_config = {"from_attributes": True} for v2

class ProfileResponse(BaseModel):
    user: UserRead
    organization: Optional[OrganizationRead] = None
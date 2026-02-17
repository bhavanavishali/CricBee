from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole
from decimal import Decimal

class TournamentPricingPlanCreate(BaseModel):
    plan_name: str
    plan_range: str
    amount: Decimal
    status: str = "inactive"  # "active" or "inactive"

class TournamentPricingPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    plan_range: Optional[str] = None
    amount: Optional[Decimal] = None
    status: Optional[str] = None

class TournamentPricingPlanStatusUpdate(BaseModel):
    status: str  # "active" or "inactive"

class TournamentPricingPlanResponse(BaseModel):
    id: int
    plan_name: str
    plan_range: str
    amount: Decimal
    status: str
    tournaments: int = 0
    revenue: Decimal = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
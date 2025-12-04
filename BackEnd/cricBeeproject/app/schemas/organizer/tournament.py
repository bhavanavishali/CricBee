from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

class TournamentDetailsCreate(BaseModel):
    overs: int = Field(..., gt=0, le=50)
    start_date: date
    end_date: date
    registration_start_date: date
    registration_end_date: date
    location: str
    venue_details: Optional[str] = None
    team_range: str
    is_public: bool = True

class TournamentCreate(BaseModel):
    tournament_name: str
    plan_id: int
    details: TournamentDetailsCreate

class TournamentResponse(BaseModel):
    id: int
    tournament_name: str
    organizer_id: int
    plan_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    details: Optional['TournamentDetailsResponse'] = None
    payment: Optional['TournamentPaymentResponse'] = None
    
    class Config:
        from_attributes = True

class TournamentDetailsResponse(BaseModel):
    id: int
    tournament_id: int
    overs: int
    start_date: date
    end_date: date
    registration_start_date: date
    registration_end_date: date
    location: str
    venue_details: Optional[str] = None
    team_range: str
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TournamentPaymentResponse(BaseModel):
    id: int
    tournament_id: int
    transaction_id: Optional[str] = None 
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount: Decimal
    payment_status: str
    payment_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class OrganizerTransactionResponse(BaseModel):
    tournament_id: int
    tournament_name: str
    transaction_id: Optional[str] = None
    amount: Decimal
    payment_status: str
    payment_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class RazorpayOrderCreate(BaseModel):
    amount: Decimal
    currency: str = "INR"
    receipt: Optional[str] = None

class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: Decimal
    currency: str
    key: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    tournament_id: int

# Update forward references
TournamentResponse.model_rebuild()
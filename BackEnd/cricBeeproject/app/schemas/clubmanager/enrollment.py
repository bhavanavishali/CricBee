from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TournamentEnrollmentCreate(BaseModel):
    tournament_id: int
    club_id: int

class TournamentEnrollmentResponse(BaseModel):
    id: int
    tournament_id: int
    club_id: int
    enrolled_by: int
    enrolled_fee: Decimal
    payment_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class EnrollmentPaymentRequest(BaseModel):
    tournament_id: int
    club_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class EnrolledClubResponse(BaseModel):
    id: int
    tournament_id: int
    club_id: int
    club_name: str
    enrolled_by: int
    enrolled_by_name: str
    enrolled_by_email: Optional[str] = None
    enrolled_fee: Decimal
    payment_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


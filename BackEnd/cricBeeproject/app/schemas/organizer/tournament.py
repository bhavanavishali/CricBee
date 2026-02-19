from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.schemas.club_manager import ClubRead

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
    enrollment_fee: Decimal = Field(..., ge=1, description="fee must be at least ₹1.00")
    prize_amount: Decimal = Field(..., ge=0, description="prize amount must be at least ₹0.00")

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
    is_blocked: bool = False
    fixture_mode_id: Optional[int] = None
    winner_team_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    details: Optional['TournamentDetailsResponse'] = None
    payment: Optional['TournamentPaymentResponse'] = None
    winner_team: Optional[ClubRead] = None
    
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
    enrollment_fee: Decimal
    prize_amount: Decimal
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
    transaction_type: str
    transaction_direction: str = "debit"  # Organizer pays = Debit
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

class OrganizerWalletBalanceResponse(BaseModel):
    balance: Decimal
    total_transactions: int
    
    class Config:
        from_attributes = True

class FinanceReportRequest(BaseModel):
    filter_type: str  # 'weekly', 'monthly', 'yearly', 'custom'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class FinanceReportTransactionResponse(BaseModel):
    transaction_id: Optional[str] = None
    tournament_id: Optional[int] = None
    tournament_name: Optional[str] = None
    tournament_type: Optional[str] = None
    amount: Decimal
    status: str
    description: Optional[str] = None
    transaction_direction: str
    transaction_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TournamentUpdate(BaseModel):
    tournament_name: Optional[str] = None
    details: Optional['TournamentDetailsUpdate'] = None

class TournamentDetailsUpdate(BaseModel):
    overs: Optional[int] = Field(None, gt=0, le=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_start_date: Optional[date] = None
    registration_end_date: Optional[date] = None
    location: Optional[str] = None
    venue_details: Optional[str] = None
    team_range: Optional[str] = None
    is_public: Optional[bool] = None
    enrollment_fee: Optional[Decimal] = Field(None, ge=1, description="fee must be at least ₹1.00")
    prize_amount: Optional[Decimal] = Field(None, ge=0, description="prize amount must be at least ₹0.00")

class TournamentCancellationRequest(BaseModel):
    notification_title: str
    notification_description: str

class FinanceReportSummaryResponse(BaseModel):
    total_revenue: Decimal  # Total credits (enrollment fees)
    total_debits: Decimal  # Total debits (tournament creation fees)
    net_balance: Decimal  # Revenue - Debits
    total_transactions: int
    transactions: List[FinanceReportTransactionResponse]
    
    class Config:
        from_attributes = True


TournamentResponse.model_rebuild()
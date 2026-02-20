from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    transaction_type: str
    transaction_direction: str  
    amount: Decimal
    status: str
    tournament_id: Optional[int] = None
    tournament_name: Optional[str] = None
    tournament_status: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    skip: int
    limit: int

class AdminWalletResponse(BaseModel):
    id: int
    admin_id: int
    balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FinancialStatsResponse(BaseModel):
    total_revenue: float
    total_debits: float
    total_refunds: float
    net_balance: float
    total_transactions: int
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class TransactionType(str, enum.Enum):
    TOURNAMENT_PAYMENT = "tournament_payment"
    REFUND = "refund"
    WITHDRAWAL = "withdrawal"
    OTHER = "other"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class TransactionDirection(str, enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class AdminWallet(Base):
    __tablename__ = "admin_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    balance = Column(Numeric(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    admin = relationship("User", back_populates="admin_wallet")
    transactions = relationship("Transaction", back_populates="wallet")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, nullable=False, unique=True, index=True)  # Unique transaction ID
    wallet_id = Column(Integer, ForeignKey("admin_wallets.id"), nullable=False)
    transaction_type = Column(String, nullable=False)
    transaction_direction = Column(String, nullable=False, default="credit")  # debit or credit
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False, default=TransactionStatus.PENDING.value)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    wallet = relationship("AdminWallet", back_populates="transactions")
    tournament = relationship("Tournament")
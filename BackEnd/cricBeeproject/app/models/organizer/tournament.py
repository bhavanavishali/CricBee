from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Numeric, Date, func, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
from decimal import Decimal
import enum

class TournamentStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_END = "registration_end"
    TOURNAMENT_START = "tournament_start"
    TOURNAMENT_END = "tournament_end"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class TournamentType(str, enum.Enum):
    T10 = "T10"
    T20 = "T20"
    ODI = "ODI"
    TEST = "Test"
    OTHER = "Other"

class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_name = Column(String, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("tournament_pricing_plans.id"), nullable=False)
    status = Column(String, nullable=False, default=TournamentStatus.PENDING_PAYMENT.value)
    # tournament_type = Column(String, nullable=True)  # T10, T20, ODI, Test, Other - TEMPORARILY COMMENTED: Column doesn't exist in DB yet. Run migration: alembic upgrade head
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    is_blocked=Column(Boolean,default=False,nullable=False)
    
    organizer = relationship("User", back_populates="tournaments")
    plan = relationship("TournamentPricingPlan")
    details = relationship("TournamentDetails", back_populates="tournament", uselist=False, cascade="all, delete-orphan")
    payment = relationship("TournamentPayment", back_populates="tournament", uselist=False, cascade="all, delete-orphan")
    fixture_rounds = relationship("FixtureRound", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")

class TournamentDetails(Base):
    __tablename__ = "tournament_details"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, unique=True)
    overs = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_start_date = Column(Date, nullable=False)
    registration_end_date = Column(Date, nullable=False)
    location = Column(String, nullable=False)
    venue_details = Column(String, nullable=True)
    team_range = Column(String, nullable=False)  # e.g., "4-8 teams"
    is_public = Column(Boolean, default=True, nullable=False)
    enrollment_fee = Column(Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    tournament = relationship("Tournament", back_populates="details")

class TournamentPayment(Base):
    __tablename__ = "tournament_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, unique=True)
    transaction_id = Column(String, nullable=True, unique=True, index=True)
    razorpay_order_id = Column(String, nullable=True, unique=True, index=True)
    razorpay_payment_id = Column(String, nullable=True, unique=True, index=True)
    razorpay_signature = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String, nullable=False, default=PaymentStatus.PENDING.value)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    tournament = relationship("Tournament", back_populates="payment")

class TournamentEnrollment(Base):
    __tablename__ = "tournament_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Club Manager user ID
    enrolled_fee = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String, nullable=False, default=PaymentStatus.PENDING.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    tournament = relationship("Tournament")
    club = relationship("Club")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by])
    
    __table_args__ = (
        {'extend_existing': True},
    )
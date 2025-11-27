from sqlalchemy import Column, Integer, String, DateTime, Numeric, func
from app.db.base import Base
import enum

class PlanStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class TournamentPricingPlan(Base):
    __tablename__ = "tournament_pricing_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String, nullable=False)
    plan_range = Column(String, nullable=False)  # e.g., "1-4 teams", "5-10 teams", "11-∞ teams"
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False, default=PlanStatus.INACTIVE.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
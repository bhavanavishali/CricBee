from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class RecipientType(str, enum.Enum):
    CLUB_MANAGER = "club_manager"
    FAN = "fan"
    ALL_CLUB_MANAGERS = "all_club_managers"
    ALL_FANS = "all_fans"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    recipient_type = Column(SQLEnum(RecipientType), nullable=False)
    recipient_id = Column(Integer, nullable=True)  # Null for broadcast notifications
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    is_read = Column(String, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="notifications")
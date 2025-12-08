from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ClubPlayerInvitation(Base):
    __tablename__ = "club_player_invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False)
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    club = relationship("Club", back_populates="player_invitations")
    player = relationship("PlayerProfile", back_populates="club_invitations")
    
    __table_args__ = (
        {'extend_existing': True},
    )


from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class ClubPlayer(Base):
    __tablename__ = "club_players"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    club = relationship("Club", back_populates="players")
    player = relationship("PlayerProfile", back_populates="clubs")
    
    __table_args__ = (
        {'extend_existing': True},
    )
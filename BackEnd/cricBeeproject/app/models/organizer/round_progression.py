from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class RoundProgression(Base):
    __tablename__ = "round_progression"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    from_round = Column(String(50), nullable=False)  # e.g., "League", "Round 1", "Round 2"
    to_round = Column(String(50), nullable=False)    # e.g., "Round 2", "Round 3", "Final"
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Organizer user ID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    tournament = relationship("Tournament")
    club = relationship("Club")
    added_by_user = relationship("User")
    
    # Ensure a club can only be added once per tournament and round progression
    __table_args__ = (
        UniqueConstraint('tournament_id', 'from_round', 'to_round', 'club_id', name='uq_tournament_round_club'),
    )

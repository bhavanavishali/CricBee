from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Time, Boolean, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class FixtureRound(Base):
    __tablename__ = "fixture_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    round_name = Column(String, nullable=False)
    number_of_matches = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    tournament = relationship("Tournament", back_populates="fixture_rounds")
    matches = relationship("Match", back_populates="round", cascade="all, delete-orphan")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("fixture_rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    match_number = Column(String, nullable=False)  # e.g., "Match 1", "Match 2"
    team_a_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    team_b_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    match_date = Column(Date, nullable=False)
    match_time = Column(Time, nullable=False)
    venue = Column(String, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    round = relationship("FixtureRound", back_populates="matches")
    tournament = relationship("Tournament", back_populates="matches")
    team_a = relationship("Club", foreign_keys=[team_a_id])
    team_b = relationship("Club", foreign_keys=[team_b_id])


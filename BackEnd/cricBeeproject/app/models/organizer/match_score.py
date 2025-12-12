from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Boolean, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base
from decimal import Decimal

class MatchScore(Base):
    """Tracks the score for each team in a match"""
    __tablename__ = "match_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    runs = Column(Integer, nullable=False, default=0)
    wickets = Column(Integer, nullable=False, default=0)
    overs = Column(Numeric(5, 1), nullable=False, default=Decimal('0.0'))
    balls = Column(Integer, nullable=False, default=0)
    extras = Column(Integer, nullable=False, default=0)
    fours = Column(Integer, nullable=False, default=0)
    sixes = Column(Integer, nullable=False, default=0)
    run_rate = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    match = relationship("Match", back_populates="scores")
    team = relationship("Club")
    
    __table_args__ = (
        UniqueConstraint('match_id', 'team_id', name='uq_match_team_score'),
        {'extend_existing': True},
    )

class BallByBall(Base):
    """Tracks each ball bowled in a match"""
    __tablename__ = "ball_by_ball"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    over_number = Column(Integer, nullable=False)
    ball_number = Column(Integer, nullable=False)  # 1-6 for valid balls, can be >6 for extras
    batsman_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="SET NULL"), nullable=True)
    bowler_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="SET NULL"), nullable=True)
    runs = Column(Integer, nullable=False, default=0)
    is_wicket = Column(Boolean, nullable=False, default=False)
    wicket_type = Column(String, nullable=True)  # bowled, caught, lbw, run_out, stumped, hit_wicket, etc.
    dismissed_batsman_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="SET NULL"), nullable=True)
    is_wide = Column(Boolean, nullable=False, default=False)
    is_no_ball = Column(Boolean, nullable=False, default=False)
    is_bye = Column(Boolean, nullable=False, default=False)
    is_leg_bye = Column(Boolean, nullable=False, default=False)
    is_four = Column(Boolean, nullable=False, default=False)
    is_six = Column(Boolean, nullable=False, default=False)
    commentary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    match = relationship("Match", back_populates="ball_by_ball")
    batsman = relationship("PlayerProfile", foreign_keys=[batsman_id])
    bowler = relationship("PlayerProfile", foreign_keys=[bowler_id])
    dismissed_batsman = relationship("PlayerProfile", foreign_keys=[dismissed_batsman_id])
    
    __table_args__ = (
        {'extend_existing': True},
    )

class PlayerMatchStats(Base):
    """Tracks individual player statistics for a match"""
    __tablename__ = "player_match_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Batting stats
    runs = Column(Integer, nullable=False, default=0)
    balls_faced = Column(Integer, nullable=False, default=0)
    fours = Column(Integer, nullable=False, default=0)
    sixes = Column(Integer, nullable=False, default=0)
    strike_rate = Column(Numeric(5, 2), nullable=True)
    is_out = Column(Boolean, nullable=False, default=False)
    dismissal_type = Column(String, nullable=True)
    dismissed_by_player_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="SET NULL"), nullable=True)
    
    # Bowling stats
    overs_bowled = Column(Numeric(5, 1), nullable=False, default=Decimal('0.0'))
    maidens = Column(Integer, nullable=False, default=0)
    runs_conceded = Column(Integer, nullable=False, default=0)
    wickets_taken = Column(Integer, nullable=False, default=0)
    economy = Column(Numeric(5, 2), nullable=True)
    
    # Flags
    is_batting = Column(Boolean, nullable=False, default=False)
    is_bowling = Column(Boolean, nullable=False, default=False)
    is_striker = Column(Boolean, nullable=False, default=False)  # True if this player is on strike
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    match = relationship("Match", back_populates="player_stats")
    player = relationship("PlayerProfile", foreign_keys=[player_id])
    team = relationship("Club")
    dismissed_by = relationship("PlayerProfile", foreign_keys=[dismissed_by_player_id])
    
    __table_args__ = (
        {'extend_existing': True},
    )


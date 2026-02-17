from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Time, Boolean, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class FixtureRound(Base):
    __tablename__ = "fixture_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    round_no = Column(Integer, nullable=False, unique=True)  # 1, 2, 3 - unique across all tournaments
    round_name = Column(String, nullable=False)
    number_of_matches = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
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
    is_fixture_published = Column(Boolean, default=False, nullable=False)
    
    # Toss fields
    toss_winner_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=True)
    toss_decision = Column(String, nullable=True)  # 'bat' or 'bowl'
    batting_team_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=True)
    bowling_team_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=True)
    winner_id = Column(Integer, ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True, index=True)
    match_status = Column(String, nullable=True, default='upcoming')  # upcoming, live, completed, cancelled
    streaming_url = Column(String, nullable=True)  # YouTube or other streaming platform URL
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    round = relationship("FixtureRound", back_populates="matches")
    tournament = relationship("Tournament", back_populates="matches")
    team_a = relationship("Club", foreign_keys=[team_a_id])
    team_b = relationship("Club", foreign_keys=[team_b_id])
    toss_winner = relationship("Club", foreign_keys=[toss_winner_id])
    batting_team = relationship("Club", foreign_keys=[batting_team_id])
    bowling_team = relationship("Club", foreign_keys=[bowling_team_id])
    winner = relationship("Club", foreign_keys=[winner_id])
    playing_xis = relationship("PlayingXI", back_populates="match", cascade="all, delete-orphan")
    scores = relationship("MatchScore", back_populates="match", cascade="all, delete-orphan")
    ball_by_ball = relationship("BallByBall", back_populates="match", cascade="all, delete-orphan", order_by="BallByBall.over_number, BallByBall.ball_number")
    player_stats = relationship("PlayerMatchStats", back_populates="match", cascade="all, delete-orphan")

class PlayingXI(Base):
    __tablename__ = "playing_xi"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    is_captain = Column(Boolean, default=False, nullable=False)
    is_vice_captain = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    match = relationship("Match", back_populates="playing_xis")
    club = relationship("Club")
    player = relationship("PlayerProfile")
    
    __table_args__ = (
        {'extend_existing': True},
    )


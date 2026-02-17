from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base
from decimal import Decimal

class PointTable(Base):
    """
    Tracks points table for each team in a tournament.
    Updated automatically when match_status becomes 'completed'.
    """
    __tablename__ = "point_table"
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Match statistics
    matches_played = Column(Integer, nullable=False, default=0)  # M - Total matches played
    matches_won = Column(Integer, nullable=False, default=0)     # W - Matches won
    matches_lost = Column(Integer, nullable=False, default=0)    # L - Matches lost
    matches_tied = Column(Integer, nullable=False, default=0)    # Tied matches
    matches_no_result = Column(Integer, nullable=False, default=0)  # No result matches
    
    # Points (Win = 2, Loss = 0, Tie = 1, No Result = 1)
    points = Column(Integer, nullable=False, default=0)          # Pts - Total points
    
    # Net Run Rate calculation
    runs_scored = Column(Integer, nullable=False, default=0)     # Total runs scored
    overs_faced = Column(Numeric(10, 1), nullable=False, default=Decimal('0.0'))  # Total overs faced
    runs_conceded = Column(Integer, nullable=False, default=0)   # Total runs conceded
    overs_bowled = Column(Numeric(10, 1), nullable=False, default=Decimal('0.0'))  # Total overs bowled
    net_run_rate = Column(Numeric(6, 3), nullable=False, default=Decimal('0.000'))  # NRR - Net Run Rate
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    tournament = relationship("Tournament", backref="point_table_entries")
    team = relationship("Club")
    
    __table_args__ = (
        UniqueConstraint('tournament_id', 'team_id', name='uq_tournament_team_points'),
        {'extend_existing': True},
    )

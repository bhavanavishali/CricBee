from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Toss Schemas
class TossUpdate(BaseModel):
    toss_winner_id: int = Field(..., description="ID of the team that won the toss")
    toss_decision: str = Field(..., pattern="^(bat|bowl)$", description="Decision: 'bat' or 'bowl'")

class TossResponse(BaseModel):
    toss_winner_id: Optional[int] = None
    toss_winner_name: Optional[str] = None
    toss_decision: Optional[str] = None
    batting_team_id: Optional[int] = None
    batting_team_name: Optional[str] = None
    bowling_team_id: Optional[int] = None
    bowling_team_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Match Score Schemas
class MatchScoreResponse(BaseModel):
    id: int
    match_id: int
    team_id: int
    team_name: Optional[str] = None
    runs: int
    wickets: int
    overs: Decimal
    balls: int
    extras: int
    fours: int
    sixes: int
    run_rate: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

# Ball-by-Ball Schemas
class BallByBallCreate(BaseModel):
    over_number: int = Field(..., ge=0, description="Over number (0-indexed)")
    ball_number: int = Field(..., ge=1, le=10, description="Ball number in the over")
    batsman_id: int = Field(..., description="ID of the batsman on strike")
    bowler_id: int = Field(..., description="ID of the bowler")
    runs: int = Field(0, ge=0, le=6, description="Runs scored off the ball")
    is_wicket: bool = Field(False, description="Whether a wicket fell")
    wicket_type: Optional[str] = Field(None, description="Type of dismissal if wicket fell")
    dismissed_batsman_id: Optional[int] = Field(None, description="ID of dismissed batsman if wicket fell")
    is_wide: bool = Field(False, description="Whether it was a wide")
    is_no_ball: bool = Field(False, description="Whether it was a no-ball")
    is_bye: bool = Field(False, description="Whether it was a bye")
    is_leg_bye: bool = Field(False, description="Whether it was a leg bye")
    is_four: bool = Field(False, description="Whether it was a four")
    is_six: bool = Field(False, description="Whether it was a six")
    commentary: Optional[str] = Field(None, max_length=500, description="Commentary for the ball")

class BallByBallResponse(BaseModel):
    id: int
    match_id: int
    over_number: int
    ball_number: int
    batsman_id: Optional[int] = None
    batsman_name: Optional[str] = None
    bowler_id: Optional[int] = None
    bowler_name: Optional[str] = None
    runs: int
    is_wicket: bool
    wicket_type: Optional[str] = None
    dismissed_batsman_id: Optional[int] = None
    dismissed_batsman_name: Optional[str] = None
    is_wide: bool
    is_no_ball: bool
    is_bye: bool
    is_leg_bye: bool
    is_four: bool
    is_six: bool
    commentary: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Player Match Stats Schemas
class PlayerMatchStatsResponse(BaseModel):
    id: int
    match_id: int
    player_id: int
    player_name: Optional[str] = None
    team_id: int
    team_name: Optional[str] = None
    runs: int
    balls_faced: int
    fours: int
    sixes: int
    strike_rate: Optional[Decimal] = None
    is_out: bool
    dismissal_type: Optional[str] = None
    dismissed_by_player_id: Optional[int] = None
    dismissed_by_player_name: Optional[str] = None
    overs_bowled: Decimal
    maidens: int
    runs_conceded: int
    wickets_taken: int
    economy: Optional[Decimal] = None
    is_batting: bool
    is_bowling: bool
    
    class Config:
        from_attributes = True

# Live Scoreboard Response
class LiveScoreboardResponse(BaseModel):
    match_id: int
    match_status: str
    batting_team_id: Optional[int] = None
    batting_team_name: Optional[str] = None
    bowling_team_id: Optional[int] = None
    bowling_team_name: Optional[str] = None
    batting_score: Optional[MatchScoreResponse] = None
    bowling_score: Optional[MatchScoreResponse] = None
    current_batsman_id: Optional[int] = None
    current_batsman_name: Optional[str] = None
    current_non_striker_id: Optional[int] = None
    current_non_striker_name: Optional[str] = None
    current_bowler_id: Optional[int] = None
    current_bowler_name: Optional[str] = None
    last_6_balls: List[BallByBallResponse] = []
    player_stats: List[PlayerMatchStatsResponse] = []
    toss_info: Optional[TossResponse] = None

# Update Score Request
class UpdateScoreRequest(BaseModel):
    runs: int = Field(0, ge=0, le=6, description="Runs scored")
    is_wicket: bool = Field(False, description="Whether a wicket fell")
    wicket_type: Optional[str] = Field(None, description="Type of dismissal")
    dismissed_batsman_id: Optional[int] = Field(None, description="ID of dismissed batsman")
    is_wide: bool = Field(False, description="Whether it was a wide")
    is_no_ball: bool = Field(False, description="Whether it was a no-ball")
    is_bye: bool = Field(False, description="Whether it was a bye")
    is_leg_bye: bool = Field(False, description="Whether it was a leg bye")
    batsman_id: int = Field(..., description="ID of the batsman on strike")
    bowler_id: int = Field(..., description="ID of the bowler")
    commentary: Optional[str] = Field(None, max_length=500, description="Commentary for the ball")

# End Innings Request
class EndInningsRequest(BaseModel):
    pass  # No additional data needed, just ends the current innings






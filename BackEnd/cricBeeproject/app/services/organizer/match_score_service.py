from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from decimal import Decimal
from typing import Optional, List, Tuple
from app.models.organizer.fixture import Match
from app.models.organizer.match_score import MatchScore, BallByBall, PlayerMatchStats
from app.models.organizer.tournament import Tournament
from app.models.club import Club
from app.models.player import PlayerProfile
from app.schemas.organizer.match_score import (
    TossUpdate,
    UpdateScoreRequest,
    LiveScoreboardResponse,
    MatchScoreResponse,
    BallByBallResponse,
    PlayerMatchStatsResponse,
    TossResponse
)
from app.models.organizer.fixture import PlayingXI
import math

def update_toss(
    db: Session,
    match_id: int,
    organizer_id: int,
    toss_data: TossUpdate
) -> Match:
    """Update toss result for a match"""
    
    # Verify match exists and belongs to organizer's tournament
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Verify toss winner is one of the teams
    if toss_data.toss_winner_id not in [match.team_a_id, match.team_b_id]:
        raise ValueError("Toss winner must be one of the match teams")
    
    # Verify toss decision
    if toss_data.toss_decision not in ['bat', 'bowl']:
        raise ValueError("Toss decision must be 'bat' or 'bowl'")
    
    # Update toss fields
    match.toss_winner_id = toss_data.toss_winner_id
    match.toss_decision = toss_data.toss_decision
    
    # Set batting and bowling teams based on toss decision
    if toss_data.toss_decision == 'bat':
        match.batting_team_id = toss_data.toss_winner_id
        match.bowling_team_id = match.team_b_id if toss_data.toss_winner_id == match.team_a_id else match.team_a_id
    else:  # 'bowl'
        match.bowling_team_id = toss_data.toss_winner_id
        match.batting_team_id = match.team_b_id if toss_data.toss_winner_id == match.team_a_id else match.team_a_id
    
    # Update match status to toss_completed
    match.match_status = 'toss_completed'
    
    db.commit()
    db.refresh(match)
    
    return match

def start_match(
    db: Session,
    match_id: int,
    organizer_id: int
) -> Match:
    """Start a match - initialize scoreboard and player stats"""
    
    # Verify match exists and belongs to organizer's tournament
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Verify toss has been done
    if not match.toss_winner_id or not match.batting_team_id or not match.bowling_team_id:
        raise ValueError("Toss must be completed before starting the match")
    
    # Check if match is already started
    if match.match_status == 'live':
        return match
    
    # Initialize match scores for both teams
    batting_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.batting_team_id
    ).first()
    
    bowling_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.bowling_team_id
    ).first()
    
    if not batting_score:
        batting_score = MatchScore(
            match_id=match_id,
            team_id=match.batting_team_id,
            runs=0,
            wickets=0,
            overs=Decimal('0.0'),
            balls=0,
            extras=0,
            fours=0,
            sixes=0
        )
        db.add(batting_score)
    
    if not bowling_score:
        bowling_score = MatchScore(
            match_id=match_id,
            team_id=match.bowling_team_id,
            runs=0,
            wickets=0,
            overs=Decimal('0.0'),
            balls=0,
            extras=0,
            fours=0,
            sixes=0
        )
        db.add(bowling_score)
    
    # Initialize player stats for all players in Playing XI
    playing_xis = db.query(PlayingXI).filter(PlayingXI.match_id == match_id).all()
    
    for pxi in playing_xis:
        existing_stat = db.query(PlayerMatchStats).filter(
            PlayerMatchStats.match_id == match_id,
            PlayerMatchStats.player_id == pxi.player_id
        ).first()
        
        if not existing_stat:
            player_stat = PlayerMatchStats(
                match_id=match_id,
                player_id=pxi.player_id,
                team_id=pxi.club_id,
                runs=0,
                balls_faced=0,
                fours=0,
                sixes=0,
                is_out=False,
                overs_bowled=Decimal('0.0'),
                maidens=0,
                runs_conceded=0,
                wickets_taken=0,
                is_batting=False,
                is_bowling=False
            )
            db.add(player_stat)
    
    # Update match status
    match.match_status = 'live'
    
    db.commit()
    db.refresh(match)
    
    return match

def update_score(
    db: Session,
    match_id: int,
    organizer_id: int,
    score_data: UpdateScoreRequest
) -> BallByBall:
    """Update score for a ball"""
    
    # Verify match exists and belongs to organizer's tournament
    match = db.query(Match).options(
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Verify match is live
    if match.match_status != 'live':
        raise ValueError("Match is not live")
    
    # Get current batting team score
    batting_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.batting_team_id
    ).first()
    
    if not batting_score:
        raise ValueError("Match score not initialized. Please start the match first.")
    
    # Get tournament details to check max overs
    tournament_details = tournament.details
    max_overs = tournament_details.overs if tournament_details else 20
    max_balls = max_overs * 6
    
    # Check if innings is complete (all wickets or all overs)
    if batting_score.wickets >= 10 or batting_score.balls >= max_balls:
        raise ValueError("Innings is complete")
    
    # Calculate over and ball numbers
    current_over = int(batting_score.overs)
    current_ball = batting_score.balls % 6
    if current_ball == 0 and batting_score.balls > 0:
        current_over = int(batting_score.overs)
        current_ball = 6
    else:
        current_ball = current_ball + 1
    
    # Validate runs
    if score_data.is_wide or score_data.is_no_ball:
        # Wides and no-balls can have runs
        if score_data.runs < 0:
            raise ValueError("Runs cannot be negative")
    else:
        if score_data.runs < 0 or score_data.runs > 6:
            raise ValueError("Runs must be between 0 and 6")
    
    # Validate wicket
    if score_data.is_wicket:
        if not score_data.dismissed_batsman_id:
            raise ValueError("Dismissed batsman ID is required when wicket falls")
        if not score_data.wicket_type:
            raise ValueError("Wicket type is required when wicket falls")
    
    # Get player stats
    batsman_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == score_data.batsman_id
    ).first()
    
    bowler_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == score_data.bowler_id
    ).first()
    
    if not batsman_stat or not bowler_stat:
        raise ValueError("Player stats not found. Please start the match first.")
    
    # Calculate actual runs (excluding extras)
    actual_runs = score_data.runs
    if score_data.is_wide or score_data.is_no_ball:
        # Wide and no-ball runs are extras
        batting_score.extras += actual_runs
        batting_score.runs += actual_runs
    elif score_data.is_bye or score_data.is_leg_bye:
        # Byes and leg-byes: runs go to score but not to batsman
        batting_score.runs += actual_runs
        batting_score.extras += actual_runs
    else:
        # Normal runs
        batting_score.runs += actual_runs
        batsman_stat.runs += actual_runs
        batsman_stat.balls_faced += 1
        bowler_stat.runs_conceded += actual_runs
    
    # Update fours and sixes
    if score_data.is_four or actual_runs == 4:
        batting_score.fours += 1
        if not score_data.is_bye and not score_data.is_leg_bye:
            batsman_stat.fours += 1
    
    if score_data.is_six or actual_runs == 6:
        batting_score.sixes += 1
        if not score_data.is_bye and not score_data.is_leg_bye:
            batsman_stat.sixes += 1
    
    # Update balls and overs
    if not score_data.is_wide and not score_data.is_no_ball:
        batting_score.balls += 1
        bowler_stat.overs_bowled = Decimal(str(int(bowler_stat.overs_bowled * 10) + 1)) / Decimal('10')
    
    # Update wickets
    if score_data.is_wicket:
        batting_score.wickets += 1
        batsman_stat.is_out = True
        batsman_stat.dismissal_type = score_data.wicket_type
        if score_data.dismissed_batsman_id:
            dismissed_stat = db.query(PlayerMatchStats).filter(
                PlayerMatchStats.match_id == match_id,
                PlayerMatchStats.player_id == score_data.dismissed_batsman_id
            ).first()
            if dismissed_stat:
                dismissed_stat.is_out = True
                dismissed_stat.dismissal_type = score_data.wicket_type
                if score_data.bowler_id:
                    dismissed_stat.dismissed_by_player_id = score_data.bowler_id
        
        bowler_stat.wickets_taken += 1
    
    # Update overs
    batting_score.overs = Decimal(str(batting_score.balls)) / Decimal('6')
    
    # Calculate run rate
    if batting_score.overs > 0:
        batting_score.run_rate = Decimal(str(batting_score.runs)) / batting_score.overs
    
    # Calculate strike rate for batsman
    if batsman_stat.balls_faced > 0:
        batsman_stat.strike_rate = (Decimal(str(batsman_stat.runs)) / Decimal(str(batsman_stat.balls_faced))) * Decimal('100')
    
    # Calculate economy for bowler
    if bowler_stat.overs_bowled > 0:
        bowler_stat.economy = Decimal(str(bowler_stat.runs_conceded)) / bowler_stat.overs_bowled
    
    # Update flags
    batsman_stat.is_batting = True
    bowler_stat.is_bowling = True
    
    # Create ball-by-ball record
    ball_record = BallByBall(
        match_id=match_id,
        over_number=current_over,
        ball_number=current_ball,
        batsman_id=score_data.batsman_id,
        bowler_id=score_data.bowler_id,
        runs=actual_runs,
        is_wicket=score_data.is_wicket,
        wicket_type=score_data.wicket_type,
        dismissed_batsman_id=score_data.dismissed_batsman_id,
        is_wide=score_data.is_wide,
        is_no_ball=score_data.is_no_ball,
        is_bye=score_data.is_bye,
        is_leg_bye=score_data.is_leg_bye,
        is_four=score_data.is_four or actual_runs == 4,
        is_six=score_data.is_six or actual_runs == 6,
        commentary=score_data.commentary
    )
    
    db.add(ball_record)
    db.commit()
    db.refresh(ball_record)
    db.refresh(batting_score)
    db.refresh(batsman_stat)
    db.refresh(bowler_stat)
    
    return ball_record

def get_live_scoreboard(
    db: Session,
    match_id: int
) -> LiveScoreboardResponse:
    """Get live scoreboard for a match"""
    
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Get match scores
    batting_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.batting_team_id
    ).first()
    
    bowling_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.bowling_team_id
    ).first()
    
    # Get last 6 balls
    last_balls = db.query(BallByBall).options(
        joinedload(BallByBall.batsman),
        joinedload(BallByBall.bowler),
        joinedload(BallByBall.dismissed_batsman)
    ).filter(
        BallByBall.match_id == match_id
    ).order_by(
        BallByBall.over_number.desc(),
        BallByBall.ball_number.desc()
    ).limit(6).all()
    
    last_balls.reverse()  # Reverse to show oldest first
    
    # Get current batsmen (not out players from batting team)
    current_batsmen = db.query(PlayerMatchStats).options(
        joinedload(PlayerMatchStats.player)
    ).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == match.batting_team_id,
        PlayerMatchStats.is_batting == True,
        PlayerMatchStats.is_out == False
    ).limit(2).all()
    
    current_batsman_id = current_batsmen[0].player_id if len(current_batsmen) > 0 else None
    current_batsman_name = current_batsmen[0].player.user.full_name if len(current_batsmen) > 0 and current_batsmen[0].player and current_batsmen[0].player.user else None
    
    current_non_striker_id = current_batsmen[1].player_id if len(current_batsmen) > 1 else None
    current_non_striker_name = current_batsmen[1].player.user.full_name if len(current_batsmen) > 1 and current_batsmen[1].player and current_batsmen[1].player.user else None
    
    # Get current bowler (most recent bowler from bowling team)
    current_bowler = db.query(BallByBall).filter(
        BallByBall.match_id == match_id,
        BallByBall.bowler_id.in_(
            db.query(PlayerMatchStats.player_id).filter(
                PlayerMatchStats.match_id == match_id,
                PlayerMatchStats.team_id == match.bowling_team_id
            )
        )
    ).order_by(
        BallByBall.over_number.desc(),
        BallByBall.ball_number.desc()
    ).first()
    
    current_bowler_id = current_bowler.bowler_id if current_bowler else None
    current_bowler_name = None
    if current_bowler_id:
        bowler_player = db.query(PlayerProfile).filter(PlayerProfile.id == current_bowler_id).first()
        if bowler_player and bowler_player.user:
            current_bowler_name = bowler_player.user.full_name
    
    # Get all player stats
    player_stats = db.query(PlayerMatchStats).options(
        joinedload(PlayerMatchStats.player).joinedload(PlayerProfile.user),
        joinedload(PlayerMatchStats.team),
        joinedload(PlayerMatchStats.dismissed_by)
    ).filter(
        PlayerMatchStats.match_id == match_id
    ).all()
    
    # Build response
    batting_score_response = None
    if batting_score:
        batting_score_response = MatchScoreResponse(
            id=batting_score.id,
            match_id=batting_score.match_id,
            team_id=batting_score.team_id,
            team_name=match.batting_team.club_name if match.batting_team else None,
            runs=batting_score.runs,
            wickets=batting_score.wickets,
            overs=batting_score.overs,
            balls=batting_score.balls,
            extras=batting_score.extras,
            fours=batting_score.fours,
            sixes=batting_score.sixes,
            run_rate=batting_score.run_rate
        )
    
    bowling_score_response = None
    if bowling_score:
        bowling_score_response = MatchScoreResponse(
            id=bowling_score.id,
            match_id=bowling_score.match_id,
            team_id=bowling_score.team_id,
            team_name=match.bowling_team.club_name if match.bowling_team else None,
            runs=bowling_score.runs,
            wickets=bowling_score.wickets,
            overs=bowling_score.overs,
            balls=bowling_score.balls,
            extras=bowling_score.extras,
            fours=bowling_score.fours,
            sixes=bowling_score.sixes,
            run_rate=bowling_score.run_rate
        )
    
    last_6_balls_response = []
    for ball in last_balls:
        last_6_balls_response.append(BallByBallResponse(
            id=ball.id,
            match_id=ball.match_id,
            over_number=ball.over_number,
            ball_number=ball.ball_number,
            batsman_id=ball.batsman_id,
            batsman_name=ball.batsman.user.full_name if ball.batsman and ball.batsman.user else None,
            bowler_id=ball.bowler_id,
            bowler_name=ball.bowler.user.full_name if ball.bowler and ball.bowler.user else None,
            runs=ball.runs,
            is_wicket=ball.is_wicket,
            wicket_type=ball.wicket_type,
            dismissed_batsman_id=ball.dismissed_batsman_id,
            dismissed_batsman_name=ball.dismissed_batsman.user.full_name if ball.dismissed_batsman and ball.dismissed_batsman.user else None,
            is_wide=ball.is_wide,
            is_no_ball=ball.is_no_ball,
            is_bye=ball.is_bye,
            is_leg_bye=ball.is_leg_bye,
            is_four=ball.is_four,
            is_six=ball.is_six,
            commentary=ball.commentary,
            created_at=ball.created_at
        ))
    
    player_stats_response = []
    for stat in player_stats:
        player_stats_response.append(PlayerMatchStatsResponse(
            id=stat.id,
            match_id=stat.match_id,
            player_id=stat.player_id,
            player_name=stat.player.user.full_name if stat.player and stat.player.user else None,
            team_id=stat.team_id,
            team_name=stat.team.club_name if stat.team else None,
            runs=stat.runs,
            balls_faced=stat.balls_faced,
            fours=stat.fours,
            sixes=stat.sixes,
            strike_rate=stat.strike_rate,
            is_out=stat.is_out,
            dismissal_type=stat.dismissal_type,
            dismissed_by_player_id=stat.dismissed_by_player_id,
            dismissed_by_player_name=stat.dismissed_by.user.full_name if stat.dismissed_by and stat.dismissed_by.user else None if stat.dismissed_by else None,
            overs_bowled=stat.overs_bowled,
            maidens=stat.maidens,
            runs_conceded=stat.runs_conceded,
            wickets_taken=stat.wickets_taken,
            economy=stat.economy,
            is_batting=stat.is_batting,
            is_bowling=stat.is_bowling
        ))
    
    toss_info = None
    if match.toss_winner_id:
        toss_info = TossResponse(
            toss_winner_id=match.toss_winner_id,
            toss_winner_name=match.toss_winner.club_name if match.toss_winner else None,
            toss_decision=match.toss_decision,
            batting_team_id=match.batting_team_id,
            batting_team_name=match.batting_team.club_name if match.batting_team else None,
            bowling_team_id=match.bowling_team_id,
            bowling_team_name=match.bowling_team.club_name if match.bowling_team else None
        )
    
    return LiveScoreboardResponse(
        match_id=match.id,
        match_status=match.match_status or 'upcoming',
        batting_team_id=match.batting_team_id,
        batting_team_name=match.batting_team.club_name if match.batting_team else None,
        bowling_team_id=match.bowling_team_id,
        bowling_team_name=match.bowling_team.club_name if match.bowling_team else None,
        batting_score=batting_score_response,
        bowling_score=bowling_score_response,
        current_batsman_id=current_batsman_id,
        current_batsman_name=current_batsman_name,
        current_non_striker_id=current_non_striker_id,
        current_non_striker_name=current_non_striker_name,
        current_bowler_id=current_bowler_id,
        current_bowler_name=current_bowler_name,
        last_6_balls=last_6_balls_response,
        player_stats=player_stats_response,
        toss_info=toss_info
    )

def end_innings(
    db: Session,
    match_id: int,
    organizer_id: int
) -> Match:
    """End the current innings"""
    
    # Verify match exists and belongs to organizer's tournament
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # For single-innings formats (T10/T20/ODI), ending innings means match is completed
    match.match_status = 'completed'
    
    db.commit()
    db.refresh(match)
    
    return match


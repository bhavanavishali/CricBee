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
                is_bowling=False,
                is_striker=False
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
    # Get the last ball to determine current over/ball
    last_ball = db.query(BallByBall).filter(
        BallByBall.match_id == match_id
    ).order_by(
        BallByBall.over_number.desc(),
        BallByBall.ball_number.desc()
    ).first()
    
    if last_ball:
        current_over = last_ball.over_number
        current_ball = last_ball.ball_number
        # Check if last over is complete (6 legal balls)
        balls_in_last_over = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.over_number == current_over,
            BallByBall.is_wide == False,
            BallByBall.is_no_ball == False
        ).count()
        
        if balls_in_last_over >= 6:
            # Move to next over
            current_over = current_over + 1
            current_ball = 1
        else:
            current_ball = current_ball + 1
    else:
        # First ball
        current_over = 1
        current_ball = 1
    
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
    
    # Get player stats - create if they don't exist (in case match wasn't started properly)
    batsman_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == score_data.batsman_id
    ).first()
    
    if not batsman_stat:
        # Verify batsman is in Playing XI
        batsman_playing_xi = db.query(PlayingXI).filter(
            PlayingXI.match_id == match_id,
            PlayingXI.player_id == score_data.batsman_id,
            PlayingXI.club_id == match.batting_team_id
        ).first()
        
        if not batsman_playing_xi:
            raise ValueError(f"Batsman (ID: {score_data.batsman_id}) is not in the batting team's Playing XI")
        
        # Create PlayerMatchStats for batsman
        batsman_stat = PlayerMatchStats(
            match_id=match_id,
            player_id=score_data.batsman_id,
            team_id=match.batting_team_id,
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
            is_bowling=False,
            is_striker=False
        )
        db.add(batsman_stat)
    
    bowler_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == score_data.bowler_id
    ).first()
    
    if not bowler_stat:
        # Verify bowler is in Playing XI
        bowler_playing_xi = db.query(PlayingXI).filter(
            PlayingXI.match_id == match_id,
            PlayingXI.player_id == score_data.bowler_id,
            PlayingXI.club_id == match.bowling_team_id
        ).first()
        
        if not bowler_playing_xi:
            raise ValueError(f"Bowler (ID: {score_data.bowler_id}) is not in the bowling team's Playing XI")
        
        # Create PlayerMatchStats for bowler
        bowler_stat = PlayerMatchStats(
            match_id=match_id,
            player_id=score_data.bowler_id,
            team_id=match.bowling_team_id,
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
            is_bowling=False,
            is_striker=False
        )
        db.add(bowler_stat)
    
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
    legal_ball_bowled = False
    if not score_data.is_wide and not score_data.is_no_ball:
        batting_score.balls += 1
        legal_ball_bowled = True
        # Update bowler overs (count balls, convert to overs)
        # Count all legal balls bowled by this bowler in the match (before adding this ball)
        existing_legal_balls = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.bowler_id == score_data.bowler_id,
            BallByBall.is_wide == False,
            BallByBall.is_no_ball == False
        ).count()
        
        # Add 1 for the current ball being added
        total_legal_balls = existing_legal_balls + 1
        
        # Convert balls to overs (e.g., 13 balls = 2.1 overs)
        bowler_stat.overs_bowled = Decimal(str(total_legal_balls // 6)) + Decimal(str(total_legal_balls % 6)) / Decimal('10')
    
    # Update wickets
    if score_data.is_wicket:
        batting_score.wickets += 1
        
        # Get the dismissed batsman's stats
        dismissed_stat = db.query(PlayerMatchStats).filter(
            PlayerMatchStats.match_id == match_id,
            PlayerMatchStats.player_id == score_data.dismissed_batsman_id
        ).first()
        
        if dismissed_stat:
            dismissed_stat.is_out = True
            dismissed_stat.dismissal_type = score_data.wicket_type
            if score_data.bowler_id:
                dismissed_stat.dismissed_by_player_id = score_data.bowler_id
        else:
            raise ValueError(f"Dismissed batsman (ID: {score_data.dismissed_batsman_id}) stats not found")
        
        # If the striker is the one getting out, mark them out
        if score_data.dismissed_batsman_id == score_data.batsman_id:
            batsman_stat.is_out = True
            batsman_stat.dismissal_type = score_data.wicket_type
        
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
    
    # Check if over is complete (after commit to get accurate count)
    balls_in_over = db.query(BallByBall).filter(
        BallByBall.match_id == match_id,
        BallByBall.over_number == current_over,
        BallByBall.is_wide == False,
        BallByBall.is_no_ball == False
    ).count()
    
    over_complete = balls_in_over >= 6
    
    # ========== AUTO STRIKER ROTATION LOGIC ==========
    # Get current batsmen (striker and non-striker)
    current_batsmen = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == match.batting_team_id,
        PlayerMatchStats.is_batting == True,
        PlayerMatchStats.is_out == False
    ).all()
    
    striker_stat = None
    non_striker_stat = None
    
    for stat in current_batsmen:
        if stat.is_striker:
            striker_stat = stat
        else:
            non_striker_stat = stat
    
    # If no striker set, the batsman who faced the ball should be striker
    if not striker_stat:
        striker_stat = batsman_stat
        if batsman_stat not in current_batsmen:
            batsman_stat.is_batting = True
            batsman_stat.is_striker = True
    
    # Ensure we have both striker and non-striker
    if not striker_stat:
        striker_stat = batsman_stat
        striker_stat.is_striker = True
        striker_stat.is_batting = True
    
    # Find non-striker if not found
    if not non_striker_stat:
        for stat in current_batsmen:
            if stat.player_id != striker_stat.player_id:
                non_striker_stat = stat
                break
    
    # Only proceed with striker rotation if we have both players
    if striker_stat and non_striker_stat:
        should_swap = False
        
        # Rule 1: Wicket handling
        if score_data.is_wicket:
            dismissed_stat = db.query(PlayerMatchStats).filter(
                PlayerMatchStats.match_id == match_id,
                PlayerMatchStats.player_id == score_data.dismissed_batsman_id
            ).first()
            
            if dismissed_stat:
                # Check if dismissed batsman was striker before clearing flags
                was_striker = dismissed_stat.is_striker
                
                # Clear striker and batting flags for dismissed batsman
                dismissed_stat.is_striker = False
                dismissed_stat.is_batting = False
                
                if was_striker:
                    # Striker is out - new batsman comes on strike (no swap needed)
                    # The new batsman will be set by the frontend via setBatsmen
                    should_swap = False
                else:
                    # Non-striker is out - striker stays the same
                    should_swap = False
        # Rule 2: End of over - always swap
        elif over_complete:
            should_swap = True
        # Rule 3: Wide ball - no striker change
        elif score_data.is_wide:
            should_swap = False
        # Rule 4: No ball handling
        elif score_data.is_no_ball:
            # If runs from bat (not just penalty), apply normal run logic
            # Check if there were runs scored beyond the no-ball penalty
            runs_from_bat = actual_runs - 1 if actual_runs > 1 else 0
            if runs_from_bat > 0 and not score_data.is_bye and not score_data.is_leg_bye:
                # Runs from bat - apply normal logic
                should_swap = (runs_from_bat % 2 == 1)
            else:
                # Just no-ball penalty, no bat contact
                should_swap = False
        # Rule 5: Legal delivery - apply run-based logic
        else:
            # Odd runs = swap, Even runs = no swap
            should_swap = (actual_runs % 2 == 1)
        
        # Perform the swap if needed
        if should_swap:
            striker_stat.is_striker = False
            non_striker_stat.is_striker = True
            db.commit()
            db.refresh(striker_stat)
            db.refresh(non_striker_stat)
    
    # ========== END AUTO STRIKER ROTATION ==========
    
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
    
    # Get tournament to access max overs
    tournament = db.query(Tournament).filter(Tournament.id == match.tournament_id).first()
    
    # Get match scores
    batting_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.batting_team_id
    ).first()
    
    bowling_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.bowling_team_id
    ).first()
    
    # Get all balls for timeline
    all_balls = db.query(BallByBall).options(
        joinedload(BallByBall.batsman).joinedload(PlayerProfile.user),
        joinedload(BallByBall.bowler).joinedload(PlayerProfile.user),
        joinedload(BallByBall.dismissed_batsman).joinedload(PlayerProfile.user)
    ).filter(
        BallByBall.match_id == match_id
    ).order_by(
        BallByBall.over_number.asc(),
        BallByBall.ball_number.asc()
    ).all()
    
    # Get last 6 balls for quick view
    last_balls = all_balls[-6:] if len(all_balls) > 6 else all_balls
    
    # Get current batsmen (not out players from batting team)
    current_batsmen = db.query(PlayerMatchStats).options(
        joinedload(PlayerMatchStats.player)
    ).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == match.batting_team_id,
        PlayerMatchStats.is_batting == True,
        PlayerMatchStats.is_out == False
    ).all()
    
    # Find striker and non-striker using is_striker flag
    striker_stat = None
    non_striker_stat = None
    
    for stat in current_batsmen:
        if stat.is_striker:
            striker_stat = stat
        else:
            non_striker_stat = stat
    
    # Fallback: if no striker flag set, use first two batsmen
    if not striker_stat and len(current_batsmen) > 0:
        striker_stat = current_batsmen[0]
        if len(current_batsmen) > 1:
            non_striker_stat = current_batsmen[1]
    
    current_batsman_id = striker_stat.player_id if striker_stat else None
    current_batsman_name = striker_stat.player.user.full_name if striker_stat and striker_stat.player and striker_stat.player.user else None
    
    current_non_striker_id = non_striker_stat.player_id if non_striker_stat else None
    current_non_striker_name = non_striker_stat.player.user.full_name if non_striker_stat and non_striker_stat.player and non_striker_stat.player.user else None
    
    # Get current bowler (most recent bowler from bowling team)
    # First try to get from BallByBall (if balls have been bowled)
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
    
    # If no bowler from BallByBall, check for bowler with is_bowling=True (initial bowler)
    if not current_bowler_id:
        current_bowler_stat = db.query(PlayerMatchStats).options(
            joinedload(PlayerMatchStats.player).joinedload(PlayerProfile.user)
        ).filter(
            PlayerMatchStats.match_id == match_id,
            PlayerMatchStats.team_id == match.bowling_team_id,
            PlayerMatchStats.is_bowling == True
        ).first()
        
        if current_bowler_stat:
            current_bowler_id = current_bowler_stat.player_id
            if current_bowler_stat.player and current_bowler_stat.player.user:
                current_bowler_name = current_bowler_stat.player.user.full_name
    
    # If still no name, get it from PlayerProfile
    if current_bowler_id and not current_bowler_name:
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
    
    def build_ball_response(ball):
        return BallByBallResponse(
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
        )
    
    last_6_balls_response = [build_ball_response(ball) for ball in last_balls]
    all_balls_response = [build_ball_response(ball) for ball in all_balls]
    
    # Determine current over and ball
    current_over = None
    current_ball = None
    needs_bowler_selection = False
    
    if all_balls:
        last_ball = all_balls[-1]
        # Count legal balls in last over
        legal_balls_in_last_over = len([b for b in all_balls 
                                       if b.over_number == last_ball.over_number 
                                       and not b.is_wide and not b.is_no_ball])
        
        if legal_balls_in_last_over >= 6:
            # Over complete, need new bowler
            needs_bowler_selection = True
            current_over = last_ball.over_number + 1
            current_ball = 1
        else:
            current_over = last_ball.over_number
            current_ball = last_ball.ball_number + 1
    else:
        current_over = 1
        current_ball = 1
    
    # Get max overs from tournament
    max_overs = 20  # Default
    if tournament and tournament.details:
        max_overs = tournament.details.overs
    
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
        all_balls=all_balls_response,
        player_stats=player_stats_response,
        toss_info=toss_info,
        current_over=current_over,
        current_ball=current_ball,
        max_overs=max_overs,
        needs_bowler_selection=needs_bowler_selection
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

def get_available_batsmen(
    db: Session,
    match_id: int,
    team_id: int
) -> List[PlayerMatchStats]:
    """Get available batsmen (not out players) for a team"""
    # First try to get from PlayerMatchStats (if match has started)
    player_stats = db.query(PlayerMatchStats).options(
        joinedload(PlayerMatchStats.player).joinedload(PlayerProfile.user)
    ).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == team_id,
        PlayerMatchStats.is_out == False
    ).all()
    
    # If stats exist, return them
    if player_stats:
        return player_stats
    
    # If no stats exist yet, get from Playing XI (match might not have started yet)
    # But we need to create PlayerMatchStats-like objects for consistency
    # Actually, let's get from Playing XI and return the player info
    from app.models.organizer.fixture import PlayingXI
    playing_xi = db.query(PlayingXI).options(
        joinedload(PlayingXI.player).joinedload(PlayerProfile.user)
    ).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.club_id == team_id
    ).all()
    
    # We can't return PlayingXI as PlayerMatchStats, so return empty
    # The API endpoint should handle this case
    return []

def set_opening_batsmen(
    db: Session,
    match_id: int,
    organizer_id: int,
    striker_id: int,
    non_striker_id: int
) -> dict:
    """Set the opening batsmen for a match"""
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
    
    # Verify match is live
    if match.match_status != 'live':
        raise ValueError("Match must be live to set batsmen")
    
    # Verify both players are from batting team's Playing XI
    from app.models.organizer.fixture import PlayingXI
    striker_playing_xi = db.query(PlayingXI).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.player_id == striker_id,
        PlayingXI.club_id == match.batting_team_id
    ).first()
    
    non_striker_playing_xi = db.query(PlayingXI).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.player_id == non_striker_id,
        PlayingXI.club_id == match.batting_team_id
    ).first()
    
    if not striker_playing_xi or not non_striker_playing_xi:
        raise ValueError("One or both players are not in the batting team's Playing XI")
    
    # Get or create PlayerMatchStats for both players
    striker_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == striker_id,
        PlayerMatchStats.team_id == match.batting_team_id
    ).first()
    
    if not striker_stat:
        striker_stat = PlayerMatchStats(
            match_id=match_id,
            player_id=striker_id,
            team_id=match.batting_team_id,
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
            is_bowling=False,
            is_striker=False
        )
        db.add(striker_stat)
    
    if striker_stat.is_out:
        raise ValueError("Striker is already out")
    
    non_striker_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == non_striker_id,
        PlayerMatchStats.team_id == match.batting_team_id
    ).first()
    
    if not non_striker_stat:
        non_striker_stat = PlayerMatchStats(
            match_id=match_id,
            player_id=non_striker_id,
            team_id=match.batting_team_id,
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
            is_bowling=False,
            is_striker=False
        )
        db.add(non_striker_stat)
    
    if non_striker_stat.is_out:
        raise ValueError("Non-striker is already out")
    
    if striker_id == non_striker_id:
        raise ValueError("Striker and non-striker cannot be the same player")
    
    # Clear all is_batting and is_striker flags for batting team
    db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == match.batting_team_id
    ).update({
        PlayerMatchStats.is_batting: False,
        PlayerMatchStats.is_striker: False
    })
    
    # Set new batsmen
    striker_stat.is_batting = True
    striker_stat.is_striker = True
    non_striker_stat.is_batting = True
    non_striker_stat.is_striker = False
    
    db.commit()
    db.refresh(striker_stat)
    db.refresh(non_striker_stat)
    
    return {
        "message": "Opening batsmen set successfully",
        "striker_id": striker_id,
        "non_striker_id": non_striker_id
    }

def get_available_bowlers(
    db: Session,
    match_id: int,
    team_id: int,
    exclude_bowler_id: Optional[int] = None
) -> List[PlayerMatchStats]:
    """Get available bowlers for a team, excluding the previous over's bowler if specified"""
    
    # If exclude_bowler_id not provided, find the last completed over's bowler
    if exclude_bowler_id is None:
        all_balls = db.query(BallByBall).filter(
            BallByBall.match_id == match_id
        ).order_by(
            BallByBall.over_number.desc(),
            BallByBall.ball_number.desc()
        ).all()
        
        if all_balls:
            # Find the last completed over (6 legal balls)
            seen_overs = set()
            for ball in all_balls:
                over_number = ball.over_number
                if over_number in seen_overs:
                    continue
                
                seen_overs.add(over_number)
                
                # Count legal balls in this over
                legal_balls = db.query(BallByBall).filter(
                    BallByBall.match_id == match_id,
                    BallByBall.over_number == over_number,
                    BallByBall.is_wide == False,
                    BallByBall.is_no_ball == False
                ).count()
                
                if legal_balls >= 6:
                    # Get first ball of completed over to get bowler
                    first_ball = db.query(BallByBall).filter(
                        BallByBall.match_id == match_id,
                        BallByBall.over_number == over_number
                    ).order_by(BallByBall.ball_number.asc()).first()
                    
                    if first_ball:
                        exclude_bowler_id = first_ball.bowler_id
                    break
    
    query = db.query(PlayerMatchStats).options(
        joinedload(PlayerMatchStats.player).joinedload(PlayerProfile.user)
    ).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == team_id
    )
    
    if exclude_bowler_id:
        query = query.filter(PlayerMatchStats.player_id != exclude_bowler_id)
    
    return query.all()

def validate_bowler_selection(
    db: Session,
    match_id: int,
    bowler_id: int
) -> dict:
    """Check if bowler can be selected (not same as previous over)"""
    # Get all balls to find the last COMPLETED over
    all_balls = db.query(BallByBall).filter(
        BallByBall.match_id == match_id
    ).order_by(
        BallByBall.over_number.desc(),
        BallByBall.ball_number.desc()
    ).all()
    
    if not all_balls:
        return {"valid": True, "message": "Bowler can be selected"}
    
    # Find the last completed over (6 legal balls)
    last_completed_over = None
    seen_overs = set()
    
    for ball in all_balls:
        over_number = ball.over_number
        if over_number in seen_overs:
            continue
        
        seen_overs.add(over_number)
        
        # Count legal balls in this over
        legal_balls = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.over_number == over_number,
            BallByBall.is_wide == False,
            BallByBall.is_no_ball == False
        ).count()
        
        if legal_balls >= 6:
            last_completed_over = over_number
            break
    
    # If there's a completed over, check its bowler
    if last_completed_over:
        # Get the first ball of that over to get the bowler
        first_ball_of_over = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.over_number == last_completed_over
        ).order_by(BallByBall.ball_number.asc()).first()
        
        if first_ball_of_over and first_ball_of_over.bowler_id == bowler_id:
            return {
                "valid": False, 
                "message": "Cannot select same bowler in consecutive overs"
            }
    
    return {"valid": True, "message": "Bowler can be selected"}

def set_initial_bowler(
    db: Session,
    match_id: int,
    organizer_id: int,
    bowler_id: int
) -> dict:
    """Set the initial bowler for a match (before any balls are bowled)"""
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
    
    # Verify match is live
    if match.match_status != 'live':
        raise ValueError("Match must be live to set bowler")
    
    # Verify bowler is from bowling team's Playing XI
    from app.models.organizer.fixture import PlayingXI
    bowler_playing_xi = db.query(PlayingXI).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.player_id == bowler_id,
        PlayingXI.club_id == match.bowling_team_id
    ).first()
    
    if not bowler_playing_xi:
        raise ValueError("Bowler is not in the bowling team's Playing XI")
    
    # Get or create PlayerMatchStats for bowler
    bowler_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == bowler_id,
        PlayerMatchStats.team_id == match.bowling_team_id
    ).first()
    
    if not bowler_stat:
        bowler_stat = PlayerMatchStats(
            match_id=match_id,
            player_id=bowler_id,
            team_id=match.bowling_team_id,
            runs=0,
            balls_faced=0,
            fours=0,
            sixes=0,
            is_out=False,
            overs_bowled=Decimal('0.0'),
            maidens=0,
            runs_conceded=0,
            wickets_taken=0,
            is_bowling=False
        )
        db.add(bowler_stat)
    
    # Set is_bowling flag
    bowler_stat.is_bowling = True
    
    db.commit()
    db.refresh(bowler_stat)
    
    return {
        "message": "Bowler set successfully",
        "bowler_id": bowler_id
    }


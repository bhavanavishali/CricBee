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
from app.services.organizer import point_table_service
import math
import asyncio

def update_toss(
    db: Session,
    match_id: int,
    organizer_id: int,
    toss_data: TossUpdate
) -> Match:
   
    
   
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
   
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
  
    if toss_data.toss_winner_id not in [match.team_a_id, match.team_b_id]:
        raise ValueError("Toss winner must be one of the match teams")
    
 
    if toss_data.toss_decision not in ['bat', 'bowl']:
        raise ValueError("Toss decision must be 'bat' or 'bowl'")
    
    
    match.toss_winner_id = toss_data.toss_winner_id
    match.toss_decision = toss_data.toss_decision
 
    if toss_data.toss_decision == 'bat':
        match.batting_team_id = toss_data.toss_winner_id
        match.bowling_team_id = match.team_b_id if toss_data.toss_winner_id == match.team_a_id else match.team_a_id
    else:  # 'bowl'
        match.bowling_team_id = toss_data.toss_winner_id
        match.batting_team_id = match.team_b_id if toss_data.toss_winner_id == match.team_a_id else match.team_a_id
    
   
    match.match_status = 'toss_completed'
    
    db.commit()
    db.refresh(match)
    
    return match

def start_match(
    db: Session,
    match_id: int,
    organizer_id: int
) -> Match:
    

    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    

    if not match.toss_winner_id or not match.batting_team_id or not match.bowling_team_id:
        raise ValueError("Toss must be completed before starting the match")
    

    if match.match_status == 'live':
        return match

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
            inning_no=1,  
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
            inning_no=2,  
            runs=0,
            wickets=0,
            overs=Decimal('0.0'),
            balls=0,
            extras=0,
            fours=0,
            sixes=0
        )
        db.add(bowling_score)
    
   
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
  
    
   
    match = db.query(Match).options(
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
   
    if match.match_status != 'live':
        raise ValueError("Match is not live")
    
    batting_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.batting_team_id
    ).first()
    
    if not batting_score:
        raise ValueError("Match score not initialized. Please start the match first.")
    
   
    tournament_details = tournament.details
    max_overs = tournament_details.overs if tournament_details else 20
    max_balls = max_overs * 6
    
    
    if batting_score.wickets >= 10 or batting_score.balls >= max_balls:
        raise ValueError("Innings is complete")
    
    
   
    other_team_id = match.team_a_id if match.batting_team_id == match.team_b_id else match.team_b_id
    other_team_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == other_team_id
    ).first()
    
    is_second_innings = other_team_score and other_team_score.balls > 0
    
    
    max_overs = tournament_details.overs if tournament_details else 20
    
    if is_second_innings:

        last_ball = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.over_number > max_overs
        ).order_by(
            BallByBall.over_number.desc(),
            BallByBall.ball_number.desc()
        ).first()
        
        if not last_ball:
            
            current_over = 1
            current_ball = 1
            actual_over_number = max_overs + 1
        else:
            display_over = last_ball.over_number - max_overs  
            
            
            balls_in_last_over = db.query(BallByBall).filter(
                BallByBall.match_id == match_id,
                BallByBall.over_number == last_ball.over_number,
                BallByBall.is_wide == False,
                BallByBall.is_no_ball == False
            ).count()
            
            if balls_in_last_over >= 6:
                # Move to next over in second innings
                display_over = display_over + 1
                current_ball = 1
            else:
                # Set ball number based on legal balls count
                current_ball = balls_in_last_over + 1
            
            current_over = display_over
            
            actual_over_number = max_overs + display_over
    else:
        
        last_ball = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.over_number <= max_overs
        ).order_by(
            BallByBall.over_number.desc(),
            BallByBall.ball_number.desc()
        ).first()
        
        if last_ball:
            actual_over_number = last_ball.over_number
            current_over = last_ball.over_number
            
            
            balls_in_last_over = db.query(BallByBall).filter(
                BallByBall.match_id == match_id,
                BallByBall.over_number == current_over,
                BallByBall.is_wide == False,
                BallByBall.is_no_ball == False
            ).count()
            
            if balls_in_last_over >= 6:
                # Move to next over
                actual_over_number = current_over + 1
                current_over = current_over + 1
                current_ball = 1
            else:
                
                current_ball = balls_in_last_over + 1
        else:
            # No balls yet in first innings
            actual_over_number = 1
            current_over = 1
            current_ball = 1
    
   
    if score_data.is_wide or score_data.is_no_ball:
        
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
    

    batsman_stat = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == score_data.batsman_id
    ).first()
    
    if not batsman_stat:
 
        batsman_playing_xi = db.query(PlayingXI).filter(
            PlayingXI.match_id == match_id,
            PlayingXI.player_id == score_data.batsman_id,
            PlayingXI.club_id == match.batting_team_id
        ).first()
        
        if not batsman_playing_xi:
            raise ValueError(f"Batsman (ID: {score_data.batsman_id}) is not in the batting team's Playing XI")
        
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
    
    
    actual_runs = score_data.runs
    if score_data.is_wide or score_data.is_no_ball:
       
        batting_score.extras += actual_runs
        batting_score.runs += actual_runs
    elif score_data.is_bye or score_data.is_leg_bye:
    
        batting_score.runs += actual_runs
        batting_score.extras += actual_runs
    else:
       
        batting_score.runs += actual_runs
        batsman_stat.runs += actual_runs
        batsman_stat.balls_faced += 1
        bowler_stat.runs_conceded += actual_runs
    
   
    if score_data.is_four or actual_runs == 4:
        batting_score.fours += 1
        if not score_data.is_bye and not score_data.is_leg_bye:
            batsman_stat.fours += 1
    
    if score_data.is_six or actual_runs == 6:
        batting_score.sixes += 1
        if not score_data.is_bye and not score_data.is_leg_bye:
            batsman_stat.sixes += 1
    

    legal_ball_bowled = False
    if not score_data.is_wide and not score_data.is_no_ball:
        batting_score.balls += 1
        legal_ball_bowled = True
        
        existing_legal_balls = db.query(BallByBall).filter(
            BallByBall.match_id == match_id,
            BallByBall.bowler_id == score_data.bowler_id,
            BallByBall.is_wide == False,
            BallByBall.is_no_ball == False
        ).count()
        
       
        total_legal_balls = existing_legal_balls + 1
        
    
        bowler_stat.overs_bowled = Decimal(str(total_legal_balls // 6)) + Decimal(str(total_legal_balls % 6)) / Decimal('10')
    
    if score_data.is_wicket:
        batting_score.wickets += 1
        
        
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
    
  
    batting_score.overs = Decimal(str(batting_score.balls // 6)) + Decimal(str(batting_score.balls % 6)) / Decimal('10')
 
    if batting_score.balls > 0:
        batting_score.run_rate = Decimal(str(batting_score.runs)) / (Decimal(str(batting_score.balls)) / Decimal('6'))
    
   
    if batsman_stat.balls_faced > 0:
        batsman_stat.strike_rate = (Decimal(str(batsman_stat.runs)) / Decimal(str(batsman_stat.balls_faced))) * Decimal('100')
    

    if bowler_stat.overs_bowled > 0:
        # Economy = runs / actual overs (not cricket notation)
        # Convert cricket notation back to actual overs for economy calculation
        bowler_balls = int(bowler_stat.overs_bowled) * 6 + int((bowler_stat.overs_bowled % 1) * 10)
        if bowler_balls > 0:
            bowler_stat.economy = Decimal(str(bowler_stat.runs_conceded)) / (Decimal(str(bowler_balls)) / Decimal('6'))
    
  
    batsman_stat.is_batting = True
    bowler_stat.is_bowling = True
    

    ball_record = BallByBall(
        match_id=match_id,
        over_number=actual_over_number,
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
    
  
    balls_in_over = db.query(BallByBall).filter(
        BallByBall.match_id == match_id,
        BallByBall.over_number == current_over,
        BallByBall.is_wide == False,
        BallByBall.is_no_ball == False
    ).count()
    
    over_complete = balls_in_over >= 6
    
   
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
    
    
    if not striker_stat:
        striker_stat = batsman_stat
        if batsman_stat not in current_batsmen:
            batsman_stat.is_batting = True
            batsman_stat.is_striker = True
    
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
              
                was_striker = dismissed_stat.is_striker
                
                # Clear striker and batting flags for dismissed batsman
                dismissed_stat.is_striker = False
                dismissed_stat.is_batting = False
                
                if was_striker:
               
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
            
            runs_from_bat = actual_runs - 1 if actual_runs > 1 else 0
            if runs_from_bat > 0 and not score_data.is_bye and not score_data.is_leg_bye:
                # Runs from bat - apply normal logic
                should_swap = (runs_from_bat % 2 == 1)
            else:
                # Just no-ball penalty, no bat contact
                should_swap = False
       
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
    
    # Broadcast real-time update via WebSocket
    try:
        # Import here to avoid circular imports
        from app.core.websocket_manager import manager
        
        # Get updated scoreboard
        updated_scoreboard = get_live_scoreboard(db, match_id)
        
        # Create async task to broadcast update
        asyncio.create_task(
            manager.broadcast_to_match({
                "type": "score_update",
                "match_id": match_id,
                "scoreboard": updated_scoreboard.dict(),
                "last_ball": {
                    "over_number": ball_record.over_number,
                    "ball_number": ball_record.ball_number,
                    "runs": ball_record.runs,
                    "is_wicket": ball_record.is_wicket,
                    "is_wide": ball_record.is_wide,
                    "is_no_ball": ball_record.is_no_ball,
                    "is_bye": ball_record.is_bye,
                    "is_leg_bye": ball_record.is_leg_bye,
                    "batsman_name": ball_record.batsman.user.full_name if ball_record.batsman and ball_record.batsman.user else "Unknown",
                    "bowler_name": ball_record.bowler.user.full_name if ball_record.bowler and ball_record.bowler.user else "Unknown"
                }
            }, match_id)
        )
    except Exception as e:
        # Log error but don't fail the score update
        print(f"WebSocket broadcast error: {e}")
    
    return ball_record

def get_current_over(
    db: Session,
    match_id: int,
    tournament
) -> tuple[int, int, bool]:
    """Get current over, ball, and whether bowler selection is needed"""
    
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        return 1, 1, False
    
    # Get all balls for this match
    all_balls = db.query(BallByBall).filter(
        BallByBall.match_id == match_id
    ).order_by(
        BallByBall.over_number.asc(),
        BallByBall.ball_number.asc()
    ).all()
    
    current_over = None
    current_ball = None
    needs_bowler_selection = False
    
    # Determine if we're in second innings
    other_team_id = match.team_a_id if match.batting_team_id == match.team_b_id else match.team_b_id
    other_team_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == other_team_id
    ).first()
    
    is_second_innings = other_team_score and other_team_score.balls > 0
    
    if all_balls:
        # Filter balls to current innings only
        if is_second_innings:
            # Second innings - only consider balls with over_number > max_overs
            max_overs_local = tournament.details.overs if tournament and tournament.details else 20
            current_innings_balls = [b for b in all_balls if b.over_number > max_overs_local]
        else:
            # First innings - only consider balls with over_number <= max_overs
            max_overs_local = tournament.details.overs if tournament and tournament.details else 20
            current_innings_balls = [b for b in all_balls if b.over_number <= max_overs_local]
        
        if current_innings_balls:
            last_ball = current_innings_balls[-1]
            # Count legal balls in last over
            legal_balls_in_last_over = len([b for b in current_innings_balls 
                                           if b.over_number == last_ball.over_number 
                                           and not b.is_wide and not b.is_no_ball])
            
            if legal_balls_in_last_over >= 6:
                # Over complete, need new bowler
                needs_bowler_selection = True
                if is_second_innings:
                    display_over = (last_ball.over_number - max_overs_local) + 1
                else:
                    display_over = last_ball.over_number + 1
                current_over = display_over
                current_ball = 1
            else:
                if is_second_innings:
                    display_over = last_ball.over_number - max_overs_local
                else:
                    display_over = last_ball.over_number
                current_over = display_over
                # Set ball number based on legal balls count, not last ball number
                current_ball = legal_balls_in_last_over + 1
        else:
            current_over = 1
            current_ball = 1
    else:
        current_over = 1
        current_ball = 1
    
    return current_over, current_ball, needs_bowler_selection

def get_live_scoreboard(
    db: Session,
    match_id: int
) -> LiveScoreboardResponse:
    
    
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
    
    # Get match scores - handle None values for batting_team_id/bowling_team_id (before toss)
    batting_score = None
    if match.batting_team_id:
        batting_score = db.query(MatchScore).filter(
            MatchScore.match_id == match_id,
            MatchScore.team_id == match.batting_team_id
        ).first()
    
    bowling_score = None
    if match.bowling_team_id:
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
    
    # Get current batsmen (not out players from batting team) - handle None batting_team_id
    current_batsmen = []
    if match.batting_team_id:
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
    
    if not striker_stat and len(current_batsmen) > 0:
        striker_stat = current_batsmen[0]
        if len(current_batsmen) > 1:
            non_striker_stat = current_batsmen[1]
    
    current_batsman_id = striker_stat.player_id if striker_stat else None
    current_batsman_name = striker_stat.player.user.full_name if striker_stat and striker_stat.player and striker_stat.player.user else None
    
    current_non_striker_id = non_striker_stat.player_id if non_striker_stat else None
    current_non_striker_name = non_striker_stat.player.user.full_name if non_striker_stat and non_striker_stat.player and non_striker_stat.player.user else None
    
    # Calculate needs_bowler_selection first to determine how to get current bowler
    current_over, current_ball, needs_bowler_selection = get_current_over(
        db, match_id, tournament
    )
    
    # Convert current_over to display over for second innings
    max_overs_local = tournament.details.overs if tournament and tournament.details else 20
    other_team_id = match.team_a_id if match.batting_team_id == match.team_b_id else match.team_b_id
    other_team_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == other_team_id
    ).first()
    
    is_second_innings = other_team_score and other_team_score.balls > 0
    
    # Convert current_over to display over for second innings
    if is_second_innings and current_over > max_overs_local:
        # Convert stored over number to display over number for second innings
        display_current_over = current_over - max_overs_local
    else:
        display_current_over = current_over
    
    if all_balls:
        # Filter balls to current innings only
        if is_second_innings:
            # Second innings - only consider balls with over_number > max_overs
            max_overs_local = tournament.details.overs if tournament and tournament.details else 20
            current_innings_balls = [b for b in all_balls if b.over_number > max_overs_local]
        else:
            # First innings - only consider balls with over_number <= max_overs
            max_overs_local = tournament.details.overs if tournament and tournament.details else 20
            current_innings_balls = [b for b in all_balls if b.over_number <= max_overs_local]
        
        if current_innings_balls:
            last_ball = current_innings_balls[-1]
            # Count legal balls in last over
            legal_balls_in_last_over = len([b for b in current_innings_balls 
                                           if b.over_number == last_ball.over_number 
                                           and not b.is_wide and not b.is_no_ball])
            
            if legal_balls_in_last_over >= 6:
                # Over complete, need new bowler
                needs_bowler_selection = True
                if is_second_innings:
                    display_over = (last_ball.over_number - max_overs_local) + 1
                else:
                    display_over = last_ball.over_number + 1
                current_over = display_over
                current_ball = 1
            else:
                if is_second_innings:
                    display_over = last_ball.over_number - max_overs_local
                else:
                    display_over = last_ball.over_number
                current_over = display_over
                # Set ball number based on legal balls count, not last ball number
                current_ball = legal_balls_in_last_over + 1
        else:
            current_over = 1
            current_ball = 1
    else:
        current_over = 1
        current_ball = 1
    
    # Get current bowler - handle None bowling_team_id
    current_bowler_id = None
    current_bowler_name = None
    
    if match.bowling_team_id:
        if needs_bowler_selection:
            # Over just completed - get bowler from is_bowling flag (the newly selected bowler)
            # Don't use the last ball because it's from the completed over
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
        else:
            # Over in progress - get bowler from last ball
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
            
            # If no ball found, check is_bowling flag
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
        # Calculate display over number based on innings
        max_overs_local = tournament.details.overs if tournament and tournament.details else 20
        if ball.over_number > max_overs_local:
            # Second innings - display over number starting from 1
            display_over_number = ball.over_number - max_overs_local
        else:
            # First innings - display actual over number
            display_over_number = ball.over_number
        
        # Use ball_number directly - it's already stored correctly per over
        display_ball_number = ball.ball_number
            
        return BallByBallResponse(
            id=ball.id,
            match_id=ball.match_id,
            over_number=display_over_number,
            ball_number=display_ball_number,
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
    
    # Get max overs from tournament
    max_overs = 20  # Default
    if tournament and tournament.details:
        max_overs = tournament.details.overs
    
    # Calculate innings number and target score
    innings_number = 1
    target = None
    total_overs = None
    
    if match.batting_team_id and match.bowling_team_id:
        # Check if first innings is completed (other team has score with balls > 0)
        other_team_id = match.team_a_id if match.batting_team_id == match.team_b_id else match.team_b_id
        other_team_score = db.query(MatchScore).filter(
            MatchScore.match_id == match_id,
            MatchScore.team_id == other_team_id
        ).first()
        
        if other_team_score and other_team_score.balls > 0:
            # First innings completed, this is second innings
            innings_number = 2
            # Target = first innings score + 1
            target = other_team_score.runs + 1
            
            # Calculate total overs for first innings
            if other_team_score.overs:
                total_overs = other_team_score.overs
    
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
        current_over=display_current_over,
        current_ball=current_ball,
        max_overs=max_overs,
        needs_bowler_selection=needs_bowler_selection,
        innings_number=innings_number,
        target=target,
        total_overs=total_overs,
        streaming_url=match.streaming_url
    )

def end_innings(
    db: Session,
    match_id: int,
    organizer_id: int
) -> Match:
    """End the current innings. If first innings, swap teams and start second innings. If second innings, complete match."""
    match = db.query(Match).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if this is first or second innings
    # If the bowling team (current bowling team) has a score with balls > 0, we're ending second innings
    bowling_team_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.bowling_team_id
    ).first() if match.bowling_team_id else None
    
    is_second_innings = bowling_team_score and bowling_team_score.balls > 0
    
    if is_second_innings:
        # Ending second innings - match is ready for completion
        # Don't auto-complete, let organizer click "Complete Match" button
        # Keep match status as 'live' or set to a status that indicates ready for completion
        match.match_status = 'live'  # Keep as live so Complete Match button appears
        
    else:
        # Ending first innings - swap teams and start second innings
        # Swap batting and bowling teams
        old_batting_team_id = match.batting_team_id
        old_bowling_team_id = match.bowling_team_id
        
        match.batting_team_id = old_bowling_team_id
        match.bowling_team_id = old_batting_team_id
        
        # Initialize MatchScore for new batting team if it doesn't exist
        new_batting_score = db.query(MatchScore).filter(
            MatchScore.match_id == match_id,
            MatchScore.team_id == match.batting_team_id
        ).first()
        
        if not new_batting_score:
            new_batting_score = MatchScore(
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
            db.add(new_batting_score)
        
        # Reset all bowler flags for the new bowling team (they will select new bowlers)
        db.query(PlayerMatchStats).filter(
            PlayerMatchStats.match_id == match_id,
            PlayerMatchStats.team_id == match.bowling_team_id
        ).update({
            PlayerMatchStats.is_bowling: False
        })
        
        # Reset batting flags for new batting team (they will set new batsmen)
        db.query(PlayerMatchStats).filter(
            PlayerMatchStats.match_id == match_id,
            PlayerMatchStats.team_id == match.batting_team_id
        ).update({
            PlayerMatchStats.is_batting: False,
            PlayerMatchStats.is_striker: False
        })
        
        # Match remains 'live' for second innings
        match.match_status = 'live'
    
    db.commit()
    db.refresh(match)
    
    return match

def get_available_batsmen(
    db: Session,
    match_id: int,
    team_id: int
) -> List[PlayerMatchStats]:
    
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
    
  
    from app.models.organizer.fixture import PlayingXI
    playing_xi = db.query(PlayingXI).options(
        joinedload(PlayingXI.player).joinedload(PlayerProfile.user)
    ).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.club_id == team_id
    ).all()
    
  
    return []

def set_opening_batsmen(
    db: Session,
    match_id: int,
    organizer_id: int,
    striker_id: int,
    non_striker_id: int
) -> dict:
   
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
    """
    Get available bowlers for a team.
    Only excludes bowler from the CURRENT innings' last completed over, not from previous innings.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("Match not found")
    
    # Determine which innings we're in by checking if the bowling team has a score with balls > 0
    # If bowling team has balls, we're in second innings (they batted in first innings)
    is_second_innings = False
    if match.bowling_team_id:
        bowling_team_score = db.query(MatchScore).filter(
            MatchScore.match_id == match_id,
            MatchScore.team_id == match.bowling_team_id
        ).first()
        is_second_innings = bowling_team_score and bowling_team_score.balls > 0
    
    # Only exclude bowler if exclude_bowler_id is None (let caller specify if they want to exclude)
    # But if exclude_bowler_id is None, we should find the last completed over's bowler from CURRENT innings
    if exclude_bowler_id is None:
        # Get tournament to know max overs for first innings
        tournament = db.query(Tournament).filter(Tournament.id == match.tournament_id).first()
        max_overs_first_innings = tournament.details.overs if tournament and tournament.details else 20
        
        if is_second_innings:
            # We're in second innings - only look at balls from second innings
            # Second innings starts from over (max_overs_first_innings + 1)
            # Get all balls and filter by batting team to determine which are from second innings
            # Actually, simpler: get balls where the batsman is from the current batting team
            # and the over number is > max_overs_first_innings
            
            # Get all balls, but we need to determine which are from second innings
            # The simplest way: get balls where over_number > max_overs_first_innings
            current_innings_balls = db.query(BallByBall).filter(
                BallByBall.match_id == match_id,
                BallByBall.over_number > max_overs_first_innings
            ).order_by(
                BallByBall.over_number.desc(),
                BallByBall.ball_number.desc()
            ).all()
            
            if current_innings_balls:
                # Find the last completed over in current innings
                seen_overs = set()
                for ball in current_innings_balls:
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
            # If no balls in second innings yet, exclude_bowler_id remains None (don't exclude any)
        else:
            # We're in first innings - look at all balls (over_number <= max_overs_first_innings)
            all_balls = db.query(BallByBall).filter(
                BallByBall.match_id == match_id,
                BallByBall.over_number <= max_overs_first_innings
            ).order_by(
                BallByBall.over_number.desc(),
                BallByBall.ball_number.desc()
            ).all()
            
            if all_balls:
                # Find the last completed over
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

    # Clear all other bowlers' is_bowling flags first
    db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.team_id == match.bowling_team_id,
        PlayerMatchStats.is_bowling == True
    ).update({
        PlayerMatchStats.is_bowling: False
    })
    
    # Set new bowler's is_bowling flag
    bowler_stat.is_bowling = True
    
    db.commit()
    db.refresh(bowler_stat)
    
    return {
        "message": "Bowler set successfully",
        "bowler_id": bowler_id
    }

def complete_match(
    db: Session,
    match_id: int,
    organizer_id: int
) -> dict:
    """
    Complete a match after both innings are finished.
    Verifies both innings are completed, calculates winner, sets winner_id, and returns match result.
    """
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
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
    
    # Get scores for both teams
    team_a_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_a_id
    ).first()
    
    team_b_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_b_id
    ).first()
    
    if not team_a_score or not team_b_score:
        raise ValueError("Match scores not found. Both innings must be completed before completing the match.")
    
    # Verify both innings have been played (both teams have balls > 0)
    if team_a_score.balls == 0 or team_b_score.balls == 0:
        raise ValueError("Both innings must be completed before completing the match.")
    
    # Determine which team batted first (team that bowled in second innings)
    # After second innings ends, batting_team_id is the team that batted second
    first_innings_team_id = match.bowling_team_id  # Team that bowled second innings (batted first)
    second_innings_team_id = match.batting_team_id  # Team that batted second
    
    first_innings_score = team_a_score if first_innings_team_id == match.team_a_id else team_b_score
    second_innings_score = team_a_score if second_innings_team_id == match.team_a_id else team_b_score
    
    # Calculate winner based on cricket rules - team with higher runs wins
    if second_innings_score.runs > first_innings_score.runs:
        # Second innings team wins (chased the target)
        winner_id = second_innings_team_id
        winner_name = match.team_a.club_name if winner_id == match.team_a_id else match.team_b.club_name
        wickets_remaining = 10 - second_innings_score.wickets
        if wickets_remaining > 0:
            match_result = f"{winner_name} won by {wickets_remaining} wicket{'s' if wickets_remaining > 1 else ''}"
        else:
            margin = second_innings_score.runs - first_innings_score.runs
            match_result = f"{winner_name} won by {margin} runs"
    elif second_innings_score.runs == first_innings_score.runs:
        # Tie
        winner_id = None
        match_result = "Match Tied"
    else:
        # First innings team wins (target not reached)
        winner_id = first_innings_team_id
        winner_name = match.team_a.club_name if winner_id == match.team_a_id else match.team_b.club_name
        margin = first_innings_score.runs - second_innings_score.runs
        match_result = f"{winner_name} won by {margin} runs"
    
    # Set winner_id in match table
    match.winner_id = winner_id
    match.match_status = 'completed'
    
    # Update winning_status for both teams' scores
    if winner_id:
        # Winner gets "Win"
        winner_score = team_a_score if winner_id == match.team_a_id else team_b_score
        winner_score.winning_status = 'Win'
        
        # Loser gets "Loss"
        loser_score = team_b_score if winner_id == match.team_a_id else team_a_score
        loser_score.winning_status = 'Loss'
    else:
        # Tie - both teams get None (or could be "Tie" if preferred)
        team_a_score.winning_status = None
        team_b_score.winning_status = None
    
    db.commit()
    db.refresh(match)
    
    # Automatically update point table after match completion
    try:
        point_table_service.update_point_table_after_match(db, match_id)
    except Exception as e:
        # Log the error but don't fail the match completion
        print(f"Error updating point table: {str(e)}")
    
    return {
        "message": "Match completed successfully",
        "match_id": match_id,
        "match_status": match.match_status,
        "winner_id": winner_id,
        "winner_name": winner_name if winner_id else None,
        "match_result": match_result,
        "is_tie": winner_id is None
    }

def get_match_winner(
    db: Session,
    match_id: int
) -> dict:
    """
    Calculate and return the match winner based on cricket rules
    Returns dict with winner_id, winner_name, and match_result
    """
    match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(Match.id == match_id).first()
    
    if not match:
        raise ValueError("Match not found")
    
    if match.match_status != 'completed':
        return {
            "winner_id": None,
            "winner_name": None,
            "match_result": None,
            "is_tie": False
        }
    
    # Get scores for both teams
    team_a_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_a_id
    ).first()
    
    team_b_score = db.query(MatchScore).filter(
        MatchScore.match_id == match_id,
        MatchScore.team_id == match.team_b_id
    ).first()
    
    if not team_a_score or not team_b_score:
        return {
            "winner_id": None,
            "winner_name": None,
            "match_result": None,
            "is_tie": False
        }
    
    # Determine which team batted first (team that bowled in second innings)
    # After match completion, batting_team_id is the team that batted second
    first_innings_team_id = match.bowling_team_id  # Team that bowled second innings (batted first)
    second_innings_team_id = match.batting_team_id  # Team that batted second
    
    first_innings_score = team_a_score if first_innings_team_id == match.team_a_id else team_b_score
    second_innings_score = team_a_score if second_innings_team_id == match.team_a_id else team_b_score
    
    # Calculate winner based on cricket rules
    if second_innings_score.runs > first_innings_score.runs:
        # Second innings team wins
        winner_id = second_innings_team_id
        winner_name = match.team_a.club_name if winner_id == match.team_a_id else match.team_b.club_name
        margin = second_innings_score.runs - first_innings_score.runs
        wickets_remaining = 10 - second_innings_score.wickets
        match_result = f"{winner_name} won by {margin} runs"
        if wickets_remaining > 0:
            match_result = f"{winner_name} won by {wickets_remaining} wicket{'s' if wickets_remaining > 1 else ''}"
        return {
            "winner_id": winner_id,
            "winner_name": winner_name,
            "match_result": match_result,
            "is_tie": False
        }
    elif second_innings_score.runs == first_innings_score.runs:
        # Tie
        return {
            "winner_id": None,
            "winner_name": None,
            "match_result": "Match Tied",
            "is_tie": True
        }
    else:
        # First innings team wins (target not reached)
        winner_id = first_innings_team_id
        winner_name = match.team_a.club_name if winner_id == match.team_a_id else match.team_b.club_name
        margin = first_innings_score.runs - second_innings_score.runs
        match_result = f"{winner_name} won by {margin} runs"
        return {
            "winner_id": winner_id,
            "winner_name": winner_name,
            "match_result": match_result,
            "is_tie": False
        }


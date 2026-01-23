from sqlalchemy.orm import Session, joinedload
from datetime import date
from app.models.organizer.fixture import FixtureRound, Match
from app.models.organizer.tournament import Tournament, TournamentEnrollment, PaymentStatus
from app.models.club import Club
from app.models.organizer.match_score import MatchScore
from app.schemas.organizer.fixture import FixtureRoundCreate, MatchCreate, MatchUpdate
from typing import List, Dict
from decimal import Decimal

def can_create_fixture(db: Session, tournament_id: int, organizer_id: int) -> tuple[bool, str]:
    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        return False, "Tournament not found or access denied"
    
    if not tournament.details:
        return False, "Tournament details not found"
    
    today = date.today()
    registration_end_date = tournament.details.registration_end_date
    
    if today <= registration_end_date:
        return False, f"Fixture creation is only available after registration deadline ({registration_end_date})"
    
    return True, ""

def create_fixture_round(
    db: Session,
    round_data: FixtureRoundCreate,
    organizer_id: int
) -> FixtureRound:
   
    tournament = db.query(Tournament).filter(
        Tournament.id == round_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if fixture creation is allowed
    can_create, message = can_create_fixture(db, round_data.tournament_id, organizer_id)
    if not can_create:
        raise ValueError(message)
    
    # Create the round
    fixture_round = FixtureRound(
        tournament_id=round_data.tournament_id,
        round_name=round_data.round_name,
        number_of_matches=round_data.number_of_matches
    )
    
    db.add(fixture_round)
    db.commit()
    db.refresh(fixture_round)
    
    return fixture_round

def get_tournament_rounds(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[FixtureRound]:
   
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    rounds = db.query(FixtureRound).filter(
        FixtureRound.tournament_id == tournament_id
    ).order_by(FixtureRound.created_at.asc()).all()
    
    return rounds

def create_match(
    db: Session,
    match_data: MatchCreate,
    organizer_id: int
) -> Match:

    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Verify round exists and belongs to tournament
    round = db.query(FixtureRound).filter(
        FixtureRound.id == match_data.round_id,
        FixtureRound.tournament_id == match_data.tournament_id
    ).first()
    
    if not round:
        raise ValueError("Round not found or does not belong to this tournament")
    
    # Verify teams exist
    team_a = db.query(Club).filter(Club.id == match_data.team_a_id).first()
    team_b = db.query(Club).filter(Club.id == match_data.team_b_id).first()
    
    if not team_a or not team_b:
        raise ValueError("One or both teams not found")
    
    if match_data.team_a_id == match_data.team_b_id:
        raise ValueError("Team A and Team B cannot be the same")
    
 
    # Create match with only the required fields
    # Toss-related fields will be set later when the toss is conducted
    match = Match(
        round_id=match_data.round_id,
        tournament_id=match_data.tournament_id,
        match_number=match_data.match_number,
        team_a_id=match_data.team_a_id,
        team_b_id=match_data.team_b_id,
        match_date=match_data.match_date,
        match_time=match_data.match_time,
        venue=match_data.venue,
        is_fixture_published=False
    )
    
    # Explicitly set toss fields to None to avoid issues if columns don't exist yet
    # These will be set when the toss is conducted
    match.toss_winner_id = None
    match.toss_decision = None
    match.batting_team_id = None
    match.bowling_team_id = None
    match.match_status = 'toss_pending'  # Initial status: Toss Pending (must be published first)
    
    try:
        db.add(match)
        db.commit()
        db.refresh(match)
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        if 'toss_winner_id' in error_msg or 'toss_decision' in error_msg or 'batting_team_id' in error_msg or 'bowling_team_id' in error_msg or 'match_status' in error_msg:
            raise ValueError(
                "Database migration required. Please run: alembic upgrade head\n"
                "The matches table is missing required columns. This migration should add them: add_toss_and_scoreboard_tables"
            ) from e
        raise
    
    return match

def get_round_matches(
    db: Session,
    round_id: int,
    organizer_id: int
) -> List[Match]:
   
    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")
    
    
    tournament = db.query(Tournament).filter(
        Tournament.id == round.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(
        Match.round_id == round_id
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def get_tournament_matches(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[Match]:

    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(
        Match.tournament_id == tournament_id
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def toggle_match_published_status(
    db: Session,
    match_id: int,
    organizer_id: int
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
    
    # Verify tournament belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Toggle published status
    match.is_fixture_published = not match.is_fixture_published
    db.commit()
    db.refresh(match)
    
    return match

def get_published_tournament_matches(
    db: Session,
    tournament_id: int
) -> List[Match]:
   
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(
        Match.tournament_id == tournament_id,
        Match.is_fixture_published == True
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def get_published_round_matches(
    db: Session,
    round_id: int
) -> List[Match]:
    """Get all published matches for a round (public endpoint)"""
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.toss_winner),
        joinedload(Match.batting_team),
        joinedload(Match.bowling_team)
    ).filter(
        Match.round_id == round_id,
        Match.is_fixture_published == True
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def update_match_details(
    db: Session,
    match_id: int,
    match_update: MatchUpdate,
    organizer_id: int
) -> Match:
    
    #Update match date, time, and venue.
   
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
    
    # Allow updates even if published, as long as match hasn't started or completed
    if match.match_status in ['live', 'completed']:
        raise ValueError("Cannot update match details after match has started or completed")
    
    # Update date, time, and venue
    match.match_date = match_update.match_date
    match.match_time = match_update.match_time
    match.venue = match_update.venue
    
    db.commit()
    db.refresh(match)
    
    return match

def initialize_league_fixture_structure(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[FixtureRound]:
    
    #Initialize league fixture structure with 3 rounds: League, Playoff, Final
    
    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if fixture creation is allowed
    can_create, message = can_create_fixture(db, tournament_id, organizer_id)
    if not can_create:
        raise ValueError(message)
    
    # Check if rounds already exist
    existing_rounds = db.query(FixtureRound).filter(
        FixtureRound.tournament_id == tournament_id
    ).all()
    
    if existing_rounds:
        raise ValueError("Fixture rounds already exist for this tournament. Please use existing rounds.")
    
    # Get enrolled teams count to calculate number of matches
    enrolled_teams = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).count()
    
    if enrolled_teams < 2:
        raise ValueError("At least 2 teams must be enrolled to create league fixtures")
    
    # Calculate number of league matches using Single Round-Robin formula: n*(n-1)/2
    league_matches_count = enrolled_teams * (enrolled_teams - 1) // 2
    
    # Create the 3 rounds
    rounds_data = [
        {"name": "League", "matches": league_matches_count},
        {"name": "Playoff", "matches": 1},  # Will be updated by organizer
        {"name": "Final", "matches": 1}
    ]
    
    created_rounds = []
    for round_data in rounds_data:
        round = FixtureRound(
            tournament_id=tournament_id,
            round_name=round_data["name"],
            number_of_matches=round_data["matches"]
        )
        db.add(round)
        created_rounds.append(round)
    
    db.commit()
    
    for round in created_rounds:
        db.refresh(round)
    
    return created_rounds

def generate_league_matches(
    db: Session,
    round_id: int,
    organizer_id: int
) -> List[Match]:
   
    #Generate league matches using Single Round-Robin algorithm
    
    # Get round and verify it belongs to organizer's tournament
    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")
    
    tournament = db.query(Tournament).filter(
        Tournament.id == round.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    tournament_id = tournament.id
    
    if round.round_name != "League":
        raise ValueError("League matches can only be generated for League round")
    
    # Check if matches already exist for this round
    existing_matches = db.query(Match).filter(Match.round_id == round_id).count()
    if existing_matches > 0:
        raise ValueError("Matches already exist for this round")
    
    # Get all enrolled teams with successful payment
    enrollments = db.query(TournamentEnrollment).join(Club).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).all()
    
    if len(enrollments) < 2:
        raise ValueError("At least 2 teams must be enrolled to generate league matches")
    
    team_ids = [enrollment.club_id for enrollment in enrollments]
    
    # Generate matches using Single Round-Robin algorithm
    matches = []
    match_number = 1
    
    from datetime import time
    
    for i in range(len(team_ids)):
        for j in range(i + 1, len(team_ids)):
            # Create match with placeholder date/time/venue
            # Organizer must manually assign these values before publishing
           
            if tournament.details and tournament.details.start_date:
                placeholder_date = tournament.details.start_date
            else:
                placeholder_date = date.today()
            placeholder_time = time(10, 0)  # Placeholder time, organizer must update
            
            match = Match(
                round_id=round_id,
                tournament_id=tournament_id,
                match_number=f"Match {match_number}",
                team_a_id=team_ids[i],
                team_b_id=team_ids[j],
                match_date=placeholder_date,  # Placeholder - organizer must assign
                match_time=placeholder_time,  # Placeholder - organizer must assign
                venue="To be assigned",  # Placeholder - organizer must assign
                is_fixture_published=False,
                match_status='toss_pending',
                toss_winner_id=None,
                toss_decision=None,
                batting_team_id=None,
                bowling_team_id=None
            )
            matches.append(match)
            match_number += 1
    
    db.bulk_save_objects(matches)
    db.commit()
    
    # Refresh to get IDs and load with relationships for response
    match_ids = []
    for match in matches:
        db.refresh(match)
        match_ids.append(match.id)
    
    matches_with_relations = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(Match.id.in_(match_ids)).order_by(Match.match_number.asc()).all()
    
    return matches_with_relations

def calculate_league_standings(
    db: Session,
    tournament_id: int,
    round_id: int,
    organizer_id: int
) -> List[Dict]:
 
    #Calculate league standings based on completed matches
   
    
    # Verify tournament and round
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    round = db.query(FixtureRound).filter(
        FixtureRound.id == round_id,
        FixtureRound.tournament_id == tournament_id
    ).first()
    
    if not round or round.round_name != "League":
        raise ValueError("Invalid round. Standings can only be calculated for League round")
    
    # Get all matches in the league round
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id,
        Match.match_status == 'completed'
    ).all()
    
    # Get all enrolled teams
    enrollments = db.query(TournamentEnrollment).join(Club).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).all()
    
    # Initialize standings dictionary
    standings = {}
    for enrollment in enrollments:
        standings[enrollment.club_id] = {
            "team_id": enrollment.club_id,
            "team_name": enrollment.club.club_name,
            "matches_played": 0,
            "wins": 0,
            "losses": 0,
            "points": 0,
            "runs_scored": 0,
            "runs_conceded": 0,
            "overs_batted": Decimal('0.0'),
            "overs_bowled": Decimal('0.0'),
            "net_run_rate": Decimal('0.0')
        }
    
    # Calculate statistics from completed matches
    for match in matches:
        # Get scores for both teams
        team_a_score = db.query(MatchScore).filter(
            MatchScore.match_id == match.id,
            MatchScore.team_id == match.team_a_id
        ).first()
        
        team_b_score = db.query(MatchScore).filter(
            MatchScore.match_id == match.id,
            MatchScore.team_id == match.team_b_id
        ).first()
        
        if not team_a_score or not team_b_score:
            continue  # Skip if scores not available
        
        # Update matches played
        standings[match.team_a_id]["matches_played"] += 1
        standings[match.team_b_id]["matches_played"] += 1
        
        # Determine winner based on runs
        team_a_runs = team_a_score.runs
        team_b_runs = team_b_score.runs
        
        if team_a_runs > team_b_runs:
            standings[match.team_a_id]["wins"] += 1
            standings[match.team_a_id]["points"] += 2
            standings[match.team_b_id]["losses"] += 1
        elif team_b_runs > team_a_runs:
            standings[match.team_b_id]["wins"] += 1
            standings[match.team_b_id]["points"] += 2
            standings[match.team_a_id]["losses"] += 1
        
        # Update runs and overs for NRR calculation
        standings[match.team_a_id]["runs_scored"] += team_a_runs
        standings[match.team_a_id]["runs_conceded"] += team_b_runs
        standings[match.team_a_id]["overs_batted"] += team_a_score.overs
        
        standings[match.team_b_id]["runs_scored"] += team_b_runs
        standings[match.team_b_id]["runs_conceded"] += team_a_runs
        standings[match.team_b_id]["overs_batted"] += team_b_score.overs
    

    for team_id, stats in standings.items():
        if stats["overs_batted"] > 0:
            run_rate_for = Decimal(str(stats["runs_scored"])) / stats["overs_batted"]
            #
            run_rate_against = Decimal(str(stats["runs_conceded"])) / stats["overs_batted"] if stats["overs_batted"] > 0 else Decimal('0')
            stats["net_run_rate"] = run_rate_for - run_rate_against
    
    # Sort by points (desc), then NRR (desc)
    sorted_standings = sorted(
        standings.values(),
        key=lambda x: (x["points"], x["net_run_rate"]),
        reverse=True
    )
    
    return sorted_standings

def get_qualified_teams_for_playoff(
    db: Session,
    tournament_id: int,
    organizer_id: int,
    top_n: int = 4
) -> List[int]:
    
    # Find the League round
    league_round = db.query(FixtureRound).filter(
        FixtureRound.tournament_id == tournament_id,
        FixtureRound.round_name == "League"
    ).first()
    
    if not league_round:
        raise ValueError("League round not found")
    
    # Calculate standings
    standings = calculate_league_standings(db, tournament_id, league_round.id, organizer_id)
    
    # Return top N team IDs
    qualified_teams = [team["team_id"] for team in standings[:top_n]]
    
    return qualified_teams


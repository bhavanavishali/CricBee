from sqlalchemy.orm import Session, joinedload
from datetime import date, time
from app.models.organizer.fixture import FixtureRound, Match
from app.models.organizer.tournament import Tournament, TournamentEnrollment, PaymentStatus
from app.models.organizer.fixture_mode import FixtureMode
from app.models.club import Club
from app.models.organizer.match_score import MatchScore
from app.schemas.organizer.fixture import FixtureRoundCreate, MatchCreate, MatchUpdate, UpdateRoundName
from typing import List, Dict, Optional
from decimal import Decimal
from app.services.organizer import point_table_service



def get_all_fixture_modes(db: Session) -> List[FixtureMode]:
    return db.query(FixtureMode).all()


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

def set_tournament_fixture_mode(
    db: Session,
    tournament_id: int,
    fixture_mode_id: int,
    organizer_id: int
) -> Tournament:
    # ------  assign fixture mode to a tournament.
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    fixture_mode = db.query(FixtureMode).filter(FixtureMode.id == fixture_mode_id).first()
    if not fixture_mode:
        raise ValueError("Invalid fixture mode")
    
    tournament.fixture_mode_id = fixture_mode_id
    try:
        db.commit()
        db.refresh(tournament)
        
        # --- verify the update was successful
        if tournament.fixture_mode_id != fixture_mode_id:
            db.rollback()
            raise ValueError(f"Failed to update fixture_mode_id. Expected {fixture_mode_id}, got {tournament.fixture_mode_id}")
        
        return tournament
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to update fixture mode: {str(e)}") from e

def initialize_default_rounds(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[FixtureRound]:

    # default 3 rounds

    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    
    rounds = db.query(FixtureRound).filter(
        FixtureRound.round_no.in_([1, 2, 3])
    ).order_by(FixtureRound.round_no.asc()).all()
    

    if len(rounds) < 3:
        default_rounds = [
            {"round_no": 1, "round_name": "Round 1", "number_of_matches": 0},
            {"round_no": 2, "round_name": "Round 2", "number_of_matches": 0},
            {"round_no": 3, "round_name": "Round 3", "number_of_matches": 0}
        ]
        
        for round_data in default_rounds:
           
            existing = db.query(FixtureRound).filter(
                FixtureRound.round_no == round_data["round_no"]
            ).first()
            
            if not existing:
                round = FixtureRound(
                    round_no=round_data["round_no"],
                    round_name=round_data["round_name"],
                    number_of_matches=round_data["number_of_matches"]
                )
                db.add(round)
        
        db.commit()
        
     
        rounds = db.query(FixtureRound).filter(
            FixtureRound.round_no.in_([1, 2, 3])
        ).order_by(FixtureRound.round_no.asc()).all()
    
    return rounds

def update_round_name(
    db: Session,
    round_id: int,
    update_data: UpdateRoundName,
    organizer_id: int
) -> FixtureRound:
 
    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")
    
    
    organizer = db.query(Tournament).filter(
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not organizer:
        raise ValueError("Access denied")
    
   
    round.round_name = update_data.round_name
    db.commit()
    db.refresh(round)
    
    return round

def create_fixture_round(
    db: Session,
    round_data: FixtureRoundCreate,
    organizer_id: int
) -> FixtureRound:
#  ------ creating extra rounds.
    tournament = db.query(Tournament).filter(
        Tournament.id == round_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
   
    raise ValueError("Cannot create additional rounds. Only Round 1, Round 2, and Round 3 are available.")

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
        FixtureRound.round_no.in_([1, 2, 3])
    ).order_by(FixtureRound.round_no.asc()).all()
    
   
    if len(rounds) < 3:
        rounds = initialize_default_rounds(db, tournament_id, organizer_id)
    
    return rounds

def create_match(
    db: Session,
    match_data: MatchCreate,
    organizer_id: int
) -> Match:
    # Manually create a match.
    
    tournament = db.query(Tournament).filter(
        Tournament.id == match_data.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    round = db.query(FixtureRound).filter(
        FixtureRound.id == match_data.round_id
    ).first()
    
    if not round:
        raise ValueError("Round not found")
    
    
    team_a = db.query(Club).filter(Club.id == match_data.team_a_id).first()
    team_b = db.query(Club).filter(Club.id == match_data.team_b_id).first()
    
    if not team_a or not team_b:
        raise ValueError("One or both teams not found")
    
    if match_data.team_a_id == match_data.team_b_id:
        raise ValueError("Team A and Team B cannot be the same")
    
   
    team_a_enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == match_data.tournament_id,
        TournamentEnrollment.club_id == match_data.team_a_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).first()

    
    team_b_enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == match_data.tournament_id,
        TournamentEnrollment.club_id == match_data.team_b_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).first()
    # both teams are enrolled with sucees  payment
    if not team_a_enrollment:
        raise ValueError(f"Team A ({team_a.club_name if team_a else 'Unknown'}) is not enrolled in this tournament or payment is not successful")
    
    if not team_b_enrollment:
        raise ValueError(f"Team B ({team_b.club_name if team_b else 'Unknown'}) is not enrolled in this tournament or payment is not successful")
    
 
    
    match = Match(
        round_id=match_data.round_id,
        tournament_id=match_data.tournament_id,
        match_number=match_data.match_number,
        team_a_id=match_data.team_a_id,
        team_b_id=match_data.team_b_id,
        match_date=match_data.match_date,
        match_time=match_data.match_time,
        venue=match_data.venue,
        is_fixture_published=False,
        streaming_url=match_data.streaming_url
    )
    
   
    # these will be set when the toss is conducted after
    match.toss_winner_id = None
    match.toss_decision = None
    match.batting_team_id = None
    match.bowling_team_id = None
    match.match_status = 'toss_pending' 
    
    try:
        db.add(match)
        db.commit()
        db.refresh(match)
        
        # --- automatically initialize points table 
        try:
            
            from app.models.organizer.point_table import PointTable
            existing_points = db.query(PointTable).filter(
                PointTable.tournament_id == match_data.tournament_id
            ).first()
            
            if not existing_points:
                # --- iInitialize points to all enrolled clubs
                point_table_service.initialize_point_table_for_tournament(
                    db, match_data.tournament_id
                )
        except Exception as points_error:
           
            print(f"Warning: Could not initialize points table: {str(points_error)}")
            
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        if 'toss_winner_id' in error_msg or 'toss_decision' in error_msg or 'batting_team_id' in error_msg or 'bowling_team_id' in error_msg or 'match_status' in error_msg:
            raise ValueError(
                
                "The matches table is missing required columns."
            ) from e
        raise
    
    return match

def get_round_matches(
    db: Session,
    round_id: int,
    organizer_id: int,
    tournament_id: Optional[int] = None
) -> List[Match]:
    
    # Get matches for a specific round.

    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")

    if tournament_id:
        tournament = db.query(Tournament).filter(
            Tournament.id == tournament_id,
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
            Match.round_id == round_id,
            Match.tournament_id == tournament_id
        ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    else:
        
        organizer_tournament = db.query(Tournament).filter(
            Tournament.organizer_id == organizer_id
        ).first()
        
        if not organizer_tournament:
            raise ValueError("Access denied")
        
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
    # ----- Get all matches for one tournament.
    
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
    

    tournament = db.query(Tournament).filter(
        Tournament.id == match.tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
  
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
    
    #--- Update match date, time, and venue.
   
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
    

    if match.match_status in ['live', 'completed']:
        raise ValueError("Cannot update match details after match has started or completed")
    
    match.match_date = match_update.match_date
    match.match_time = match_update.match_time
    match.venue = match_update.venue
    match.streaming_url = match_update.streaming_url
    
    db.commit()
    db.refresh(match)
    
    return match

def initialize_league_fixture_structure(
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
    
    
    can_create, message = can_create_fixture(db, tournament_id, organizer_id)
    if not can_create:
        raise ValueError(message)
    
    # Get enrolled teams count to calculate number of matches
    enrolled_teams = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).count()
    
    if enrolled_teams < 2:
        raise ValueError("At least 2 teams must be enrolled to create league fixtures")
    
    #  using Single Round-Robin formula: n*(n-1)/2
    league_matches_count = enrolled_teams * (enrolled_teams - 1) // 2
    
    
    rounds = initialize_default_rounds(db, tournament_id, organizer_id)
    
    
    round_1 = next((r for r in rounds if r.round_no == 1), None)
    round_2 = next((r for r in rounds if r.round_no == 2), None)
    round_3 = next((r for r in rounds if r.round_no == 3), None)
    
    if round_1:
        round_1.round_name = "League"
        round_1.number_of_matches = league_matches_count
    if round_2:
        round_2.round_name = "Playoff"
        round_2.number_of_matches = 1
    if round_3:
        round_3.round_name = "Final"
        round_3.number_of_matches = 1
    
    db.commit()
    
    
    for round in rounds:
        db.refresh(round)
    
    return rounds

def generate_league_matches(
    db: Session,
    round_id: int,
    organizer_id: int,
    tournament_id: Optional[int] = None
) -> List[Match]:
   
  
    round = db.query(FixtureRound).filter(FixtureRound.id == round_id).first()
    
    if not round:
        raise ValueError("Round not found")
    
    
    if round.round_no != 1:
        raise ValueError("League matches can only be generated for Round 1")
    
    
    if not tournament_id:
        raise ValueError("Tournament ID is required")
    
    
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
   
    enrollments = db.query(TournamentEnrollment).join(Club).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).all()
    
    if len(enrollments) < 2:
        raise ValueError("At least 2 teams must be enrolled to generate league matches")
    
    team_ids = [enrollment.club_id for enrollment in enrollments]
    
    #  using Single Round-Robin formula: n*(n-1)/2
    expected_match_count = len(team_ids) * (len(team_ids) - 1) // 2
    
    
    existing_matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id,
        Match.tournament_id == tournament_id
    ).all()
    
   
    if existing_matches and len(existing_matches) >= expected_match_count:
        # Matches already exist, return them instead of creating duplicates
        # Sort by match_number to ensure consistent ordering
        return sorted(existing_matches, key=lambda m: m.match_number)
    
    # Check for duplicate team combinations before creating matches
    # This prevents creating matches that already exist
    existing_team_combinations = set()
    for match in existing_matches:
        # Store both (team_a, team_b) and (team_b, team_a) to catch duplicates regardless of order
        existing_team_combinations.add((match.team_a_id, match.team_b_id))
        existing_team_combinations.add((match.team_b_id, match.team_a_id))
    
    # Generate matches using Single Round-Robin algorithm
    matches = []
    match_number = 1
    
    from datetime import time
    
    for i in range(len(team_ids)):
        for j in range(i + 1, len(team_ids)):
            # Check if this team combination already exists
            team_pair = (team_ids[i], team_ids[j])
            reverse_pair = (team_ids[j], team_ids[i])
            
            if team_pair in existing_team_combinations or reverse_pair in existing_team_combinations:
                # Skip this match as it already exists
                continue
            
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
    
    # Only add matches if there are new ones to create
    if not matches:
        # No new matches to create, return existing ones
        matches_with_relations = db.query(Match).options(
            joinedload(Match.team_a),
            joinedload(Match.team_b)
        ).filter(
            Match.round_id == round_id,
            Match.tournament_id == tournament_id
        ).order_by(Match.match_number.asc()).all()
        return matches_with_relations
    
    # Use add_all to add matches to session (makes them persistent)
    db.add_all(matches)
    db.commit()
    
    # Query matches back from database with relationships loaded
    # This ensures we have the persisted objects with IDs
    # Get all matches (both existing and newly created)
    all_matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id,
        Match.tournament_id == tournament_id
    ).order_by(Match.match_number.asc()).all()
    
    return all_matches

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
    
    # Verify round is Round 1 (League round)
    round = db.query(FixtureRound).filter(
        FixtureRound.id == round_id,
        FixtureRound.round_no == 1
    ).first()
    
    if not round:
        raise ValueError("Invalid round. Standings can only be calculated for Round 1 (League round)")
    
    # Get all matches in the league round for this tournament
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(
        Match.round_id == round_id,
        Match.tournament_id == tournament_id,
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
    
    # Find the League round (Round 1, which should be named "League")
    league_round = db.query(FixtureRound).filter(
        FixtureRound.round_no == 1
    ).first()
    
    if not league_round:
        raise ValueError("League round (Round 1) not found")
    
    # Calculate standings
    standings = calculate_league_standings(db, tournament_id, league_round.id, organizer_id)
    
    # Return top N team IDs
    qualified_teams = [team["team_id"] for team in standings[:top_n]]
    
    return qualified_teams

def generate_semi_finals(
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
    
    if tournament.fixture_mode_id != 2:
        raise ValueError("Semi-finals can only be auto-generated in League Fixture mode")
    
    # Get Round 1 (League Stage) - global round
    round_1 = db.query(FixtureRound).filter(
        FixtureRound.round_no == 1
    ).first()
    
    if not round_1:
        raise ValueError("Round 1 not found")
    
    # Check if all Round 1 matches for this tournament are completed
    round_1_matches = db.query(Match).filter(
        Match.round_id == round_1.id,
        Match.tournament_id == tournament_id
    ).all()
    
    if not round_1_matches:
        raise ValueError("No matches found in Round 1")
    
    incomplete_matches = [m for m in round_1_matches if m.match_status != 'completed']
    if incomplete_matches:
        raise ValueError("All Round 1 matches must be completed before generating semi-finals")
    
    # Get top 4 teams
    standings = calculate_league_standings(db, tournament_id, round_1.id, organizer_id)
    if len(standings) < 4:
        raise ValueError("At least 4 teams required for semi-finals")
    
    top_4_teams = [team["team_id"] for team in standings[:4]]
    
    # Get Round 2 (Semi Finals) - global round
    round_2 = db.query(FixtureRound).filter(
        FixtureRound.round_no == 2
    ).first()
    
    if not round_2:
        raise ValueError("Round 2 not found")
    
    # Check if semi-finals already exist for this tournament
    existing_matches = db.query(Match).filter(
        Match.round_id == round_2.id,
        Match.tournament_id == tournament_id
    ).count()
    if existing_matches > 0:
        raise ValueError("Semi-final matches already exist")
    
    # Create 2 semi-final matches
    # Match 1: Rank 1 vs Rank 4
    # Match 2: Rank 2 vs Rank 3
    
    if tournament.details and tournament.details.start_date:
        placeholder_date = tournament.details.start_date
    else:
        placeholder_date = date.today()
    placeholder_time = time(10, 0)
    
    semi_final_matches = [
        {
            "match_number": "Semi Final 1",
            "team_a_id": top_4_teams[0],  # Rank 1
            "team_b_id": top_4_teams[3]   # Rank 4
        },
        {
            "match_number": "Semi Final 2",
            "team_a_id": top_4_teams[1],  # Rank 2
            "team_b_id": top_4_teams[2]   # Rank 3
        }
    ]
    
    created_matches = []
    for match_data in semi_final_matches:
        match = Match(
            round_id=round_2.id,
            tournament_id=tournament_id,
            match_number=match_data["match_number"],
            team_a_id=match_data["team_a_id"],
            team_b_id=match_data["team_b_id"],
            match_date=placeholder_date,
            match_time=placeholder_time,
            venue="To be assigned",
            is_fixture_published=False,
            match_status='toss_pending',
            toss_winner_id=None,
            toss_decision=None,
            batting_team_id=None,
            bowling_team_id=None
        )
        db.add(match)
        created_matches.append(match)
    
    # Update Round 2 number_of_matches
    round_2.number_of_matches = 2
    
    db.commit()
    
    for match in created_matches:
        db.refresh(match)
    
    # Load with relationships
    matches_with_relations = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(Match.id.in_([m.id for m in created_matches])).all()
    
    return matches_with_relations

def generate_final(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> Match:
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    if tournament.fixture_mode_id != 2:
        raise ValueError("Final can only be auto-generated in League Fixture mode")
    
    # Get Round 2 (Semi Finals) - global round
    round_2 = db.query(FixtureRound).filter(
        FixtureRound.round_no == 2
    ).first()
    
    if not round_2:
        raise ValueError("Round 2 not found")
    
    # Get semi-final matches for this tournament
    semi_final_matches = db.query(Match).filter(
        Match.round_id == round_2.id,
        Match.tournament_id == tournament_id
    ).all()
    
    if len(semi_final_matches) != 2:
        raise ValueError("Exactly 2 semi-final matches required")
    
    # Check if both semi-finals are completed
    incomplete_matches = [m for m in semi_final_matches if m.match_status != 'completed']
    if incomplete_matches:
        raise ValueError("Both semi-final matches must be completed before generating final")
    
    # Determine winners of semi-finals
    winners = []
    for match in semi_final_matches:
        team_a_score = db.query(MatchScore).filter(
            MatchScore.match_id == match.id,
            MatchScore.team_id == match.team_a_id
        ).first()
        
        team_b_score = db.query(MatchScore).filter(
            MatchScore.match_id == match.id,
            MatchScore.team_id == match.team_b_id
        ).first()
        
        if not team_a_score or not team_b_score:
            raise ValueError(f"Scores not found for match {match.match_number}")
        
        if team_a_score.runs > team_b_score.runs:
            winners.append(match.team_a_id)
        elif team_b_score.runs > team_a_score.runs:
            winners.append(match.team_b_id)
        else:
            raise ValueError(f"Match {match.match_number} ended in a tie. Cannot determine winner.")
    
    if len(winners) != 2:
        raise ValueError("Could not determine winners from semi-finals")
    
    # Get Round 3 (Final) - global round
    round_3 = db.query(FixtureRound).filter(
        FixtureRound.round_no == 3
    ).first()
    
    if not round_3:
        raise ValueError("Round 3 not found")
    
    # Check if final already exists for this tournament
    existing_match = db.query(Match).filter(
        Match.round_id == round_3.id,
        Match.tournament_id == tournament_id
    ).first()
    if existing_match:
        raise ValueError("Final match already exists")
    
    # Create final match
    if tournament.details and tournament.details.start_date:
        placeholder_date = tournament.details.start_date
    else:
        placeholder_date = date.today()
    placeholder_time = time(10, 0)
    
    final_match = Match(
        round_id=round_3.id,
        tournament_id=tournament_id,
        match_number="Final",
        team_a_id=winners[0],
        team_b_id=winners[1],
        match_date=placeholder_date,
        match_time=placeholder_time,
        venue="To be assigned",
        is_fixture_published=False,
        match_status='toss_pending',
        toss_winner_id=None,
        toss_decision=None,
        batting_team_id=None,
        bowling_team_id=None
    )
    
    db.add(final_match)
    
    # Update Round 3 number_of_matches
    round_3.number_of_matches = 1
    
    db.commit()
    db.refresh(final_match)
    
    # Load with relationships
    final_match = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b)
    ).filter(Match.id == final_match.id).first()
    
    return final_match


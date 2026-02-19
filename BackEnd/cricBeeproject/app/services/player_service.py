# app/services/player_service.py
from sqlalchemy.orm import Session, joinedload
from app.models.player import PlayerProfile
from app.models.user import User
from app.models.club_player import ClubPlayer
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerRead, PlayerProfileResponse
from app.schemas.user import UserRead
from app.schemas.club_manager import ClubRead
from fastapi import UploadFile
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings

def get_player_profile(db: Session, user_id: int) -> PlayerProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    return PlayerProfileResponse(
        user=UserRead.model_validate(user),  
        player_profile=PlayerRead.model_validate(player_profile) if player_profile else None
    )

def create_player_profile(db: Session, payload: PlayerCreate, user_id: int) -> PlayerProfile:
    existing_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    if existing_profile:
        raise ValueError("Player profile already exists ")
    
    player_profile = PlayerProfile(
        user_id=user_id,
        age=payload.age,
        address=payload.address,
        cricb_id=f"CRICB{user_id:06d}"  
    )
    db.add(player_profile)
    db.commit()
    db.refresh(player_profile)
    return player_profile

def update_player_profile(db: Session, player_id: int, payload: PlayerUpdate, user_id: int) -> PlayerProfile:
    player_profile = db.query(PlayerProfile).filter(
        PlayerProfile.id == player_id, 
        PlayerProfile.user_id == user_id
    ).first()
    if not player_profile:
        raise ValueError("Player profile not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(player_profile, field, value)
    
    db.commit()
    db.refresh(player_profile)
    return player_profile


def update_player_profile_photo(
    db: Session,
    user_id: int,
    uploaded_file: UploadFile,
) -> User:

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    
    folder = f"players/{user_id}/profile"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
    
    user.profile_photo = image_url
    db.commit()
    db.refresh(user)
    return user

def get_player_current_club(db: Session, user_id: int):
    """Get the current club of a player"""
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    if not player_profile:
        raise ValueError("Player profile not found")
    
    club_player = db.query(ClubPlayer).options(
        joinedload(ClubPlayer.club)
    ).filter(ClubPlayer.player_id == player_profile.id).first()
    
    if not club_player:
        return None
    
    return {
        "club": club_player.club,
        "joined_at": club_player.joined_at
    }

def leave_club(db: Session, user_id: int):
    # remove player from their current club
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    if not player_profile:
        raise ValueError("Player profile not found")
    
    club_player = db.query(ClubPlayer).filter(ClubPlayer.player_id == player_profile.id).first()
    if not club_player:
        raise ValueError("Player is not a member of any club")
    
    
    club = club_player.club
    
    db.delete(club_player)
    db.flush()  # Flush to exclude the deleted player from the count
    
    # Update player count
    club.no_of_players = max(0, db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count())
    
    # Update club verification status
    club.club_is_verified = club.no_of_players >= 3
    
    db.commit()
    return True

def get_player_dashboard_data(db: Session, user_id: int):
    """Get player dashboard data including club, tournaments, and matches"""
    from app.models.organizer.tournament import TournamentEnrollment, Tournament, TournamentDetails
    from app.models.organizer.fixture import Match
    from app.models.club import Club
    from app.schemas.player import (
        PlayerDashboardResponse, PlayerDashboardClub, 
        PlayerDashboardTournament, PlayerDashboardMatch
    )
    
    # Get player profile
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    if not player_profile:
        raise ValueError("Player profile not found")
    
    # Get player's club
    club_player = db.query(ClubPlayer).options(
        joinedload(ClubPlayer.club)
    ).filter(ClubPlayer.player_id == player_profile.id).first()
    
    dashboard_club = None
    tournaments = []
    matches = []
    stats = {
        "total_tournaments": 0,
        "upcoming_matches": 0,
        "completed_matches": 0
    }
    
    if club_player:
        club = club_player.club
        dashboard_club = PlayerDashboardClub(
            id=club.id,
            club_name=club.club_name,
            short_name=club.short_name,
            location=club.location,
            club_image=club.club_image,
            joined_at=club_player.joined_at
        )
        
        # Get tournaments where the club is enrolled
        enrollments = db.query(TournamentEnrollment).options(
            joinedload(TournamentEnrollment.tournament).joinedload(Tournament.details)
        ).filter(
            TournamentEnrollment.club_id == club.id,
            TournamentEnrollment.payment_status == "success"
        ).all()
        
        for enrollment in enrollments:
            tournament = enrollment.tournament
            if tournament.details:
                tournaments.append(PlayerDashboardTournament(
                    id=tournament.id,
                    tournament_name=tournament.tournament_name,
                    status=tournament.status,
                    start_date=tournament.details.start_date,
                    end_date=tournament.details.end_date,
                    location=tournament.details.location,
                    overs=tournament.details.overs,
                    enrollment_status=enrollment.payment_status
                ))
        
        stats["total_tournaments"] = len(tournaments)
        
        # Get matches for the club
        tournament_ids = [enrollment.tournament_id for enrollment in enrollments]
        
        if tournament_ids:
            club_matches = db.query(Match).options(
                joinedload(Match.team_a),
                joinedload(Match.team_b),
                joinedload(Match.tournament),
                joinedload(Match.round)
            ).filter(
                Match.tournament_id.in_(tournament_ids),
                Match.is_fixture_published == True,
                (Match.team_a_id == club.id) | (Match.team_b_id == club.id)
            ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
            
            for match in club_matches:
                # Determine opponent
                if match.team_a_id == club.id:
                    opponent_name = match.team_b.club_name
                    opponent_id = match.team_b_id
                else:
                    opponent_name = match.team_a.club_name
                    opponent_id = match.team_a_id
                
                matches.append(PlayerDashboardMatch(
                    id=match.id,
                    match_number=match.match_number,
                    tournament_name=match.tournament.tournament_name,
                    opponent_name=opponent_name,
                    opponent_id=opponent_id,
                    match_date=match.match_date,
                    match_time=match.match_time,
                    venue=match.venue,
                    match_status=match.match_status or 'upcoming',
                    round_name=match.round.round_name if match.round else None
                ))
                
                # Update stats
                if match.match_status == 'completed':
                    stats["completed_matches"] += 1
                elif match.match_status in ['upcoming', 'live', None]:
                    stats["upcoming_matches"] += 1
    
    return PlayerDashboardResponse(
        club=dashboard_club,
        tournaments=tournaments,
        matches=matches,
        stats=stats
    )
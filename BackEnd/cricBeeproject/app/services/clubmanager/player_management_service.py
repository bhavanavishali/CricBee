"""
Player management service - handles player search, addition, removal, and creation.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.models.club import Club
from app.models.user import User, UserRole
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.models.club_player_invitation import ClubPlayerInvitation, InvitationStatus
from app.utils.hashing import hash_password


def search_player_by_cricb_id(db: Session, cricb_id: str, club_id: int = None) -> dict:
    """Search for a player by CricB ID and check their club status."""
    cricb_id = cricb_id.upper().strip()
    
    player_profile = db.query(PlayerProfile).options(
        joinedload(PlayerProfile.user)
    ).filter(PlayerProfile.cricb_id == cricb_id).first()
    
    if not player_profile:
        raise ValueError("Player not found with this CricB ID")
    
    # Check if player is already in any club
    existing_club_player = db.query(ClubPlayer).options(
        joinedload(ClubPlayer.club)
    ).filter(ClubPlayer.player_id == player_profile.id).first()
    
    current_club = None
    is_already_in_any_club = existing_club_player is not None
    
    if is_already_in_any_club:
        current_club = existing_club_player.club
    
    is_already_in_club = False
    has_pending_invitation = False
    if club_id:
        # Check if player is already in this specific club
        existing = db.query(ClubPlayer).filter(
            ClubPlayer.club_id == club_id,
            ClubPlayer.player_id == player_profile.id
        ).first()
        is_already_in_club = existing is not None
        
        # Check for pending invitation
        pending_invitation = db.query(ClubPlayerInvitation).filter(
            ClubPlayerInvitation.club_id == club_id,
            ClubPlayerInvitation.player_id == player_profile.id,
            ClubPlayerInvitation.status == InvitationStatus.PENDING
        ).first()
        has_pending_invitation = pending_invitation is not None
    
    return {
        "player_profile": player_profile,
        "user": player_profile.user,
        "is_already_in_club": is_already_in_club,
        "is_already_in_any_club": is_already_in_any_club,
        "current_club": current_club,
        "has_pending_invitation": has_pending_invitation
    }


def add_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayer:
    """Add player to club (used after invitation acceptance)."""
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    # Verify player exists
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.id == player_id).first()
    if not player_profile:
        raise ValueError("Player not found")
    
    existing = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id == player_id
    ).first()
    if existing:
        raise ValueError("Player is already in this club")
    
    # Create association
    club_player = ClubPlayer(
        club_id=club_id,
        player_id=player_id
    )
    db.add(club_player)
    db.flush()  # Flush to include the new player in the count
    
    # Update player count
    club.no_of_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count()
    
    # Update club verification status
    club.club_is_verified = club.no_of_players >= 3
    
    db.commit()
    db.refresh(club_player)
    return club_player


def get_club_players(db: Session, club_id: int, manager_id: int) -> list:
    """Get all players in a club."""
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    club_players = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id
    ).options(
        joinedload(ClubPlayer.player).joinedload(PlayerProfile.user)
    ).all()
    
    return club_players


def remove_player_from_club(db: Session, club_id: int, player_id: int, manager_id: int) -> bool:
    """Remove a player from a club."""
    from app.models.organizer.fixture import PlayingXI, Match
    
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    club_player = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id == player_id
    ).first()
    
    if not club_player:
        raise ValueError("Player is not in this club")
    
    # Check if player is in any Playing XI for upcoming or live matches
    playing_xi_entries = db.query(PlayingXI).join(
        Match, PlayingXI.match_id == Match.id
    ).filter(
        PlayingXI.player_id == player_id,
        PlayingXI.club_id == club_id,
        Match.match_status.in_(['upcoming', 'live'])
    ).all()
    
    if playing_xi_entries:
        # Get match details for error message
        match_numbers = [entry.match.match_number for entry in playing_xi_entries[:3]]  # Show up to 3 matches
        match_list = ", ".join(match_numbers)
        if len(playing_xi_entries) > 3:
            match_list += f" and {len(playing_xi_entries) - 3} more"
        raise ValueError(f"Cannot remove player. They are currently selected in Playing XI for: {match_list}")
    
    db.delete(club_player)
    db.flush()  # Flush to exclude the deleted player from the count
    
    # Update player count
    club.no_of_players = max(0, db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count())
    
    # Update club verification status
    club.club_is_verified = club.no_of_players >= 3
    
    db.commit()
    return True


def generate_cricb_id(db: Session) -> str:
    """Generate a unique CricB ID with retry logic to handle race conditions."""
    import random
    import time
    
    max_attempts = 10
    for attempt in range(max_attempts):
        # Get all existing CricB IDs and find the maximum numeric value
        all_players = db.query(PlayerProfile.cricb_id).filter(
            PlayerProfile.cricb_id.like('CRICB%')
        ).all()
        
        if all_players:
            # Extract numeric parts and find the maximum
            max_number = 0
            for (cricb_id,) in all_players:
                try:
                    numeric_part = int(cricb_id[5:])  # Remove 'CRICB' prefix
                    max_number = max(max_number, numeric_part)
                except (ValueError, IndexError):
                    continue
            new_number = max_number + 1
        else:
            new_number = 1
        
        # Generate new ID
        new_cricb_id = f"CRICB{new_number:06d}"
        
        # Check if this ID already exists (race condition check)
        existing = db.query(PlayerProfile).filter(
            PlayerProfile.cricb_id == new_cricb_id
        ).first()
        
        if not existing:
            return new_cricb_id
        
        # If ID exists (race condition), add a small random delay and retry
        time.sleep(random.uniform(0.01, 0.05))
    
    # If all attempts failed, raise an error
    raise ValueError("Failed to generate unique CricB ID after multiple attempts")


def create_new_player(db: Session, club_id: int, player_data: dict, manager_id: int) -> dict:
    """Create a new player and automatically link them to the club."""
    from app.services.clubmanager.club_profile_service import get_club
    
    # Verify club ownership
    club = get_club(db, manager_id)
    if not club or club.id != club_id:
        raise ValueError("Club not found or access denied")
    
    # Check if email already exists
    existing_user_email = db.query(User).filter(User.email == player_data['email']).first()
    if existing_user_email:
        raise ValueError("A user with this email already exists")
    
    # Check if phone already exists
    existing_user_phone = db.query(User).filter(User.phone == player_data['phone']).first()
    if existing_user_phone:
        raise ValueError("A user with this phone number already exists")
    
    # Generate dummy password and hash it
    dummy_password = "TempPassword123!"
    hashed_password = hash_password(dummy_password)
    
    try:
        # Create User
        user = User(
            full_name=player_data['full_name'],
            email=player_data['email'],
            phone=player_data['phone'],
            hashed_password=hashed_password,
            role=UserRole.PLAYER,
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
        db.add(user)
        db.flush()  # Get the user ID without committing
        
        # Generate CricB ID
        cricb_id = generate_cricb_id(db)
        
        # Create Player Profile
        player_profile = PlayerProfile(
            user_id=user.id,
            age=player_data['age'],
            address=player_data['address'],
            cricb_id=cricb_id
        )
        db.add(player_profile)
        db.flush()  # Get the player profile ID
        
        # Create Club Player relationship (automatically link to club)
        club_player = ClubPlayer(
            club_id=club_id,
            player_id=player_profile.id
        )
        db.add(club_player)
        db.flush()  # Flush to include the new player in the count
        
        # Update club's player count
        club.no_of_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count()
        
        # Update club verification status
        club.club_is_verified = club.no_of_players >= 3
        
        db.commit()
        
        # Refresh objects to get updated data
        db.refresh(user)
        db.refresh(player_profile)
        db.refresh(club_player)
        
        return {
            "user": user,
            "player_profile": player_profile,
            "club_player": club_player,
            "message": f"Player {player_data['full_name']} created successfully with CricB ID: {cricb_id}"
        }
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if 'email' in error_msg.lower():
            raise ValueError("A user with this email already exists")
        elif 'phone' in error_msg.lower():
            raise ValueError("A user with this phone number already exists")
        elif 'cricb_id' in error_msg.lower():
            raise ValueError("Failed to generate unique CricB ID. Please try again.")
        else:
            raise ValueError("Failed to create player due to a database constraint violation")
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to create player: {str(e)}")


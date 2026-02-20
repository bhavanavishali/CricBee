
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import UploadFile
from datetime import datetime
from app.models.club import Club
from app.models.user import User, UserRole
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.models.club_player_invitation import ClubPlayerInvitation, InvitationStatus
from app.models.admin.transaction import Transaction
from app.schemas.club_manager import ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
from app.schemas.user import UserRead
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings
from app.utils.hashing import hash_password

def get_club(db: Session, user_id: int) -> Club | None:
    return db.query(Club).filter(Club.manager_id == user_id).first()

def get_club_by_id(db: Session, club_id: int) -> Club | None:
    
    return db.query(Club).options(
        joinedload(Club.manager)
    ).filter(Club.id == club_id).first()

def create_club(db: Session, payload: ClubCreate, user_id: int) -> Club:
    existing_club = get_club(db, user_id)
    if existing_club:
        raise ValueError("Club already exists for this user")
    
    
    existing_short_name = db.query(Club).filter(Club.short_name == payload.short_name).first()
    if existing_short_name:
        raise ValueError(f"Club with short name '{payload.short_name}' already exists. Please choose a different short name.")
    
    
    existing_club_name = db.query(Club).filter(Club.club_name == payload.club_name).first()
    if existing_club_name:
        raise ValueError(f"Club with name '{payload.club_name}' already exists. Please choose a different club name.")
    
    club = Club(
        manager_id=user_id,
        club_name=payload.club_name,
        description=payload.description,
        short_name=payload.short_name,
        location=payload.location,
        club_image=payload.club_image,
        is_active=True,
        no_of_players=0
    )
    db.add(club)
    try:
        db.commit()
        db.refresh(club)
    except IntegrityError as e:
        db.rollback()
        
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if 'short_name' in error_msg.lower():
            raise ValueError(f"Club with short name '{payload.short_name}' already exists. Please choose a different short name.")
        elif 'club_name' in error_msg.lower():
            raise ValueError(f"Club with name '{payload.club_name}' already exists. Please choose a different club name.")
        else:
            raise ValueError("Failed to create club due to a database constraint violation.")
    return club

def update_club(db: Session, club_id: int, payload: ClubUpdate, user_id: int) -> Club:
    club = db.query(Club).filter(
        Club.id == club_id, 
        Club.manager_id == user_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    
    
    if 'short_name' in update_data:
        existing_short_name = db.query(Club).filter(
            Club.short_name == update_data['short_name'],
            Club.id != club_id
        ).first()
        if existing_short_name:
            raise ValueError(f"Club with short name '{update_data['short_name']}' already exists. Please choose a different short name.")
    
    if 'club_name' in update_data:
        existing_club_name = db.query(Club).filter(
            Club.club_name == update_data['club_name'],
            Club.id != club_id
        ).first()
        if existing_club_name:
            raise ValueError(f"Club with name '{update_data['club_name']}' already exists. Please choose a different club name.")
    
    for field, value in update_data.items():
        setattr(club, field, value)
    
    try:
        db.commit()
        db.refresh(club)
    except IntegrityError as e:
        db.rollback()
        
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if 'short_name' in error_msg.lower():
            raise ValueError(f"Club with short name '{update_data.get('short_name', '')}' already exists. Please choose a different short name.")
        elif 'club_name' in error_msg.lower():
            raise ValueError(f"Club with name '{update_data.get('club_name', '')}' already exists. Please choose a different club name.")
        else:
            raise ValueError("Failed to update club due to a database constraint violation.")
    return club

def update_club_image(
    db: Session,
    club_id: int,
    user_id: int,
    uploaded_file: UploadFile,
) -> Club:
  
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == user_id,
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")

   
    folder = f"{settings.aws_s3_organization_folder}/clubs/{user_id}"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
    
    club.club_image = image_url
    db.commit()
    db.refresh(club)
    return club

def get_profile(db: Session, user_id: int) -> ClubProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    club = get_club(db, user_id)
    return ClubProfileResponse(
        user=UserRead.model_validate(user),  
        club=ClubRead.model_validate(club) if club else None
    )




def search_player_by_cricb_id(db: Session, cricb_id: str, club_id: int = None) -> dict:
   
  
    cricb_id = cricb_id.upper().strip()
    
  
    player_profile = db.query(PlayerProfile).options(
        joinedload(PlayerProfile.user)
    ).filter(PlayerProfile.cricb_id == cricb_id).first()
    
    if not player_profile:
        raise ValueError("Player not found with this CricB ID")
   
    
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

def invite_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayerInvitation:
    #Create a pending invitation for a player to join a club
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
    
    # Check if player is already in club
    existing = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id == player_id
    ).first()
    if existing:
        raise ValueError("Player is already in this club")
    
    # Check if there's already a pending invitation
    pending_invitation = db.query(ClubPlayerInvitation).filter(
        ClubPlayerInvitation.club_id == club_id,
        ClubPlayerInvitation.player_id == player_id,
        ClubPlayerInvitation.status == InvitationStatus.PENDING
    ).first()
    if pending_invitation:
        raise ValueError("A pending invitation already exists for this player")
    
    # Create invitation
    invitation = ClubPlayerInvitation(
        club_id=club_id,
        player_id=player_id,
        status=InvitationStatus.PENDING
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation

def add_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayer:
    #Add player to club (used after invitation acceptance)
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

def accept_club_invitation(db: Session, invitation_id: int, player_user_id: int) -> ClubPlayer:
   
    invitation = db.query(ClubPlayerInvitation).options(
        joinedload(ClubPlayerInvitation.player).joinedload(PlayerProfile.user),
        joinedload(ClubPlayerInvitation.club)
    ).filter(ClubPlayerInvitation.id == invitation_id).first()
    
    if not invitation:
        raise ValueError("Invitation not found")
    
    # Verify the invitation belongs to the player
    if invitation.player.user_id != player_user_id:
        raise ValueError("This invitation does not belong to you")
    
    if invitation.status != InvitationStatus.PENDING:
        raise ValueError("This invitation has already been processed")
    
    # Add player to club
    club_player = add_player_to_club(db, invitation.club_id, invitation.player_id, invitation.club.manager_id)
    
    # Update invitation status
    invitation.status = InvitationStatus.ACCEPTED
    invitation.responded_at = datetime.utcnow()
    db.commit()
    
    return club_player

def reject_club_invitation(db: Session, invitation_id: int, player_user_id: int) -> ClubPlayerInvitation:
    #Reject a club invitation
    invitation = db.query(ClubPlayerInvitation).options(
        joinedload(ClubPlayerInvitation.player).joinedload(PlayerProfile.user)
    ).filter(ClubPlayerInvitation.id == invitation_id).first()
    
    if not invitation:
        raise ValueError("Invitation not found")
    
    # Verify the invitation belongs to the player
    if invitation.player.user_id != player_user_id:
        raise ValueError("This invitation does not belong to you")
    
    if invitation.status != InvitationStatus.PENDING:
        raise ValueError("This invitation has already been processed")
    
    # Update invitation status
    invitation.status = InvitationStatus.REJECTED
    invitation.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(invitation)
    
    return invitation

def get_pending_invitations_for_club(db: Session, club_id: int, manager_id: int) -> list:
   
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    invitations = db.query(ClubPlayerInvitation).filter(
        ClubPlayerInvitation.club_id == club_id,
        ClubPlayerInvitation.status == InvitationStatus.PENDING
    ).options(
        joinedload(ClubPlayerInvitation.player).joinedload(PlayerProfile.user)
    ).all()
    
    return invitations

def get_invitations_for_player(db: Session, player_user_id: int) -> list:
 
    player_profile = db.query(PlayerProfile).filter(
        PlayerProfile.user_id == player_user_id
    ).first()
    
    if not player_profile:
        raise ValueError("Player profile not found")
    
    invitations = db.query(ClubPlayerInvitation).filter(
        ClubPlayerInvitation.player_id == player_profile.id
    ).options(
        joinedload(ClubPlayerInvitation.club).joinedload(Club.manager)
    ).order_by(ClubPlayerInvitation.requested_at.desc()).all()
    
    return invitations

def get_club_players(db: Session, club_id: int, manager_id: int) -> list:
    
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


def get_dashboard_stats(db: Session, user_id: int) -> dict:
    """Get dashboard statistics for club manager"""
    club = get_club(db, user_id)
    if not club:
        raise ValueError("Club not found")
    
    # Get player count
    player_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count()
    
    # Get enrolled tournaments count
    from app.models.organizer.tournament import TournamentEnrollment
    tournament_count = db.query(TournamentEnrollment).filter(TournamentEnrollment.club_id == club.id).count()
    
    return {
        "player_count": player_count,
        "tournament_count": tournament_count,
        "club_id": club.id
    }

def get_club_manager_transactions(db: Session, club_manager_id: int) -> list:
    """Get all transactions for a club manager"""
    transactions = db.query(Transaction).filter(
        Transaction.club_manager_id == club_manager_id
    ).order_by(Transaction.created_at.desc()).all()
    return transactions

def get_club_manager_wallet_balance(db: Session, club_manager_id: int) -> float:
    """Calculate wallet balance for a club manager from transactions"""
    from app.models.admin.transaction import TransactionDirection, TransactionStatus
    
    # All credit transactions (refunds, payments to club manager) add to wallet balance
    # Include both SUCCESS and REFUNDED status for credit transactions
    credit_total = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.club_manager_id == club_manager_id,
        Transaction.transaction_direction == TransactionDirection.CREDIT.value,
        Transaction.status.in_([TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value])
    ).scalar() or 0
    
    return float(credit_total)

def generate_cricb_id(db: Session) -> str:
    """Generate a unique CricB ID with retry logic to handle race conditions"""
    from app.models.player import PlayerProfile
    import random
    
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
        import time
        time.sleep(random.uniform(0.01, 0.05))
    
    # If all attempts failed, raise an error
    raise ValueError("Failed to generate unique CricB ID after multiple attempts")

def update_club_verification_status(db: Session, club_id: int) -> Club:
    """Update club verification status based on player count (minimum 3 players required)"""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise ValueError("Club not found")
    
    # Count active players in the club
    player_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count()
    
    # Update verification status: True if 3+ players, False otherwise
    club.club_is_verified = player_count >= 3
    
    db.commit()
    db.refresh(club)
    return club

def refresh_club_player_count(db: Session, manager_id: int) -> dict:
    """Refresh and fix the player count for a club manager's club"""
    club = db.query(Club).filter(Club.manager_id == manager_id).first()
    if not club:
        raise ValueError("Club not found")
    
    # Count actual players in the club
    actual_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count()
    
    # Store old values for comparison
    old_count = club.no_of_players
    old_verified = club.club_is_verified
    
    # Update the count
    club.no_of_players = actual_count
    
    # Update verification status (requires 3+ players)
    club.club_is_verified = actual_count >= 3
    
    db.commit()
    db.refresh(club)
    
    return {
        "club_id": club.id,
        "club_name": club.club_name,
        "old_count": old_count,
        "new_count": actual_count,
        "was_fixed": old_count != actual_count,
        "verification_changed": old_verified != club.club_is_verified,
        "is_verified": club.club_is_verified
    }

def create_new_player(db: Session, club_id: int, player_data: dict, manager_id: int) -> dict:
    """Create a new player and automatically link them to the club"""
    
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
            hashed_password=hashed_password,  # Using the hashed password
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

from sqlalchemy.orm import Session, joinedload
from fastapi import UploadFile
from datetime import datetime
from app.models.club import Club
from app.models.user import User, UserRole
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.models.club_player_invitation import ClubPlayerInvitation, InvitationStatus
from app.schemas.club_manager import ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
from app.schemas.user import UserRead
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings

def get_club(db: Session, user_id: int) -> Club | None:
    return db.query(Club).filter(Club.manager_id == user_id).first()

def get_club_by_id(db: Session, club_id: int) -> Club | None:
    """Get club by ID (for organizers/admins to view club details)"""
    return db.query(Club).options(
        joinedload(Club.manager)
    ).filter(Club.id == club_id).first()

def create_club(db: Session, payload: ClubCreate, user_id: int) -> Club:
    existing_club = get_club(db, user_id)
    if existing_club:
        raise ValueError("Club already exists for this user")
    
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
    db.commit()
    db.refresh(club)
    return club

def update_club(db: Session, club_id: int, payload: ClubUpdate, user_id: int) -> Club:
    club = db.query(Club).filter(
        Club.id == club_id, 
        Club.manager_id == user_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(club, field, value)
    
    db.commit()
    db.refresh(club)
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

    # Upload to S3
    folder = f"{settings.aws_s3_organization_folder}/clubs/{user_id}"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
    # Update club record
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


# Player management functions

def search_player_by_cricb_id(db: Session, cricb_id: str, club_id: int = None) -> dict:
   
  
    cricb_id = cricb_id.upper().strip()
    
  
    player_profile = db.query(PlayerProfile).options(
        joinedload(PlayerProfile.user)
    ).filter(PlayerProfile.cricb_id == cricb_id).first()
    
    if not player_profile:
        raise ValueError("Player not found with this CricB ID")
   
    is_already_in_club = False
    has_pending_invitation = False
    if club_id:
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
        "has_pending_invitation": has_pending_invitation
    }

def invite_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayerInvitation:
    """Create a pending invitation for a player to join a club"""
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
    """Add player to club (used after invitation acceptance)"""
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
    
    # Update player count
    club.no_of_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count() + 1
    
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
    """Reject a club invitation"""
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
    
    db.delete(club_player)
    
    # Update player count
    club.no_of_players = max(0, db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count() - 1)
    
    db.commit()
    return True
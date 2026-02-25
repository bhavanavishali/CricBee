

from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from app.models.club import Club
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.models.club_player_invitation import ClubPlayerInvitation, InvitationStatus
from app.services.player.player_management_service import add_player_to_club


def invite_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayerInvitation:
    
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


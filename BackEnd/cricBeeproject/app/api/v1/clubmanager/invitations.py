# api/v1/clubmanager/invitations.py
"""
Invitation Management Routes
Handles club player invitation operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubPlayerInvitationResponse, ClubPlayerInvitationListResponse, ClubRead
)
from app.services.clubmanager.invitation_service import get_pending_invitations_for_club
from app.schemas.player import PlayerRead
from app.schemas.user import UserRead
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["invitations"])


@router.get("/club/{club_id}/invitations/pending", response_model=ClubPlayerInvitationListResponse)
def get_pending_invitations_endpoint(
    club_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all pending invitations for a club"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view invitations"
        )
    
    try:
        invitations = get_pending_invitations_for_club(db, club_id, current_user.id)
        return ClubPlayerInvitationListResponse(
            invitations=[
                ClubPlayerInvitationResponse(
                    id=inv.id,
                    club=ClubRead.model_validate(inv.club),
                    player_profile=PlayerRead.model_validate(inv.player),
                    user=UserRead.model_validate(inv.player.user),
                    status=inv.status.value,
                    requested_at=inv.requested_at,
                    responded_at=inv.responded_at
                )
                for inv in invitations
            ],
            total=len(invitations)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


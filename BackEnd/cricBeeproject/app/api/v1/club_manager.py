# api/v1/endpoints/club_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse, ClubProfileUpdate,
    PlayerSearchResponse, AddPlayerRequest, ClubPlayerResponse, ClubPlayersListResponse,
    ClubPlayerInvitationResponse, ClubPlayerInvitationListResponse
)
from app.services.club_service import (
    get_profile, create_club, update_club, update_club_image, get_club,
    search_player_by_cricb_id, invite_player_to_club, get_club_players, remove_player_from_club,
    get_pending_invitations_for_club
)
from app.services.clubmanager.fixture_service import (
    get_club_manager_matches,
    get_club_players_for_match,
    set_playing_xi,
    get_playing_xi
)
from app.schemas.organizer.fixture import MatchResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.schemas.player import PlayerRead
from app.schemas.user import UserRead
from app.services.auth_service import update_user
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["club_profile"])

@router.get("/", response_model=ClubProfileResponse)
def get_club_profile_endpoint(request: Request, db: Session = Depends(get_db)):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only club managers can access this profile"
        )
    return get_profile(db, current_user.id)

@router.post("/club", response_model=ClubRead, status_code=status.HTTP_201_CREATED)
async def create_club_endpoint(
    request: Request,
    club_name: str = Form(...),
    description: str = Form(...),
    short_name: str = Form(...),
    location: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
  
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only club managers can create clubs"
        )
    
    # Validate and upload image if provided
    image_url = None
    if file:
        if file.content_type is None or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image uploads are allowed",
            )
        try:
            folder = f"{settings.aws_s3_organization_folder}/clubs/{current_user.id}"
            image_url = upload_file_to_s3(file, folder=folder)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(exc)}",
            )
    
    try:
        payload = ClubCreate(
            club_name=club_name,
            description=description,
            short_name=short_name,
            location=location,
            club_image=image_url
        )
        club = create_club(db, payload, current_user.id)
        return club
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/", response_model=ClubProfileResponse)
def update_profile_endpoint(
    payload: ClubProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
):

    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can update their profile",
        )

    if not payload.user and not payload.club:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to update",
        )

    try:
        # Update user details if provided
        if payload.user:
            update_user(db, current_user.id, payload.user)
        
        # Update club details if provided
        if payload.club:
            club = get_club(db, current_user.id)
            if not club:
                raise ValueError("Club not found")
            update_club(db, club.id, payload.club, current_user.id)
        
        # Return updated profile
        return get_profile(db, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.patch("/club/{club_id}", response_model=ClubRead)
def update_club_endpoint(
    club_id: int,
    payload: ClubUpdate,
    request: Request,
    db: Session = Depends(get_db)
):

    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only club managers can update clubs"
        )
    try:
        club = update_club(db, club_id, payload, current_user.id)
        return club
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/club/{club_id}/image", response_model=ClubRead)
async def upload_club_image_endpoint(
    club_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
  
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can upload club images",
        )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image uploads are allowed",
        )

    try:
        club = update_club_image(db, club_id, current_user.id, file)
        return club
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RuntimeError as exc:
        import logging
        logging.error(f"S3 upload error: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(exc)}",
        )



# Player management endpoints

@router.get("/club/{club_id}/search-player/{cricb_id}", response_model=PlayerSearchResponse)
def search_player_by_cricb_endpoint(
    club_id: int,
    cricb_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
 
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can search players"
        )
    
    # Verify club ownership
    club = get_club(db, current_user.id)
    if not club or club.id != club_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Club not found or access denied"
        )
    
    try:
        result = search_player_by_cricb_id(db, cricb_id, club_id)
        return PlayerSearchResponse(
            player_profile=PlayerRead.model_validate(result["player_profile"]),
            user=UserRead.model_validate(result["user"]),
            is_already_in_club=result["is_already_in_club"],
            has_pending_invitation=result.get("has_pending_invitation", False)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/club/{club_id}/players/invite", status_code=status.HTTP_201_CREATED)
def invite_player_to_club_endpoint(
    club_id: int,
    payload: AddPlayerRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Send an invitation to a player to join the club"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can invite players"
        )
    
    try:
        # Find player by CricB ID
        search_result = search_player_by_cricb_id(db, payload.cricb_id, club_id)
        player_profile = search_result["player_profile"]
        
        if search_result["is_already_in_club"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player is already in this club"
            )
        
        if search_result.get("has_pending_invitation", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation already exists for this player"
            )
        
        # Create invitation
        invitation = invite_player_to_club(db, club_id, player_profile.id, current_user.id)
        
        # Return response
        return {
            "message": "Invitation sent successfully",
            "invitation_id": invitation.id,
            "player_profile": PlayerRead.model_validate(player_profile),
            "user": UserRead.model_validate(player_profile.user)
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/club/{club_id}/players", response_model=ClubPlayersListResponse)
def get_club_players_endpoint(
    club_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
 
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view club players"
        )
    
    try:
        club_players = get_club_players(db, club_id, current_user.id)
        return ClubPlayersListResponse(
            players=[
                ClubPlayerResponse(
                    id=cp.id,
                    player_profile=PlayerRead.model_validate(cp.player),
                    user=UserRead.model_validate(cp.player.user),
                    joined_at=cp.joined_at
                )
                for cp in club_players
            ],
            total=len(club_players)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

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

@router.get("/fixtures", response_model=List[MatchResponse])
def get_my_fixtures(
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    # Get the club for this manager
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        matches = get_club_manager_matches(db, club.id, current_user.id)
        match_responses = [
            MatchResponse(
                id=match.id,
                round_id=match.round_id,
                tournament_id=match.tournament_id,
                match_number=match.match_number,
                team_a_id=match.team_a_id,
                team_a_name=match.team_a.club_name if match.team_a else None,
                team_b_id=match.team_b_id,
                team_b_name=match.team_b.club_name if match.team_b else None,
                match_date=match.match_date,
                match_time=match.match_time,
                venue=match.venue,
                is_fixture_published=match.is_fixture_published,
                created_at=match.created_at,
                updated_at=match.updated_at
            )
            for match in matches
        ]
        return match_responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

class PlayingXICreate(BaseModel):
    player_ids: List[int]
    captain_id: Optional[int] = None
    vice_captain_id: Optional[int] = None

class PlayingXIResponse(BaseModel):
    id: int
    match_id: int
    club_id: int
    player_id: int
    is_captain: bool
    is_vice_captain: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/fixtures/{match_id}/players", response_model=ClubPlayersListResponse)
def get_club_players_for_match_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all players in the club for Playing XI selection"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        club_players = get_club_players_for_match(db, club.id, current_user.id)
        return ClubPlayersListResponse(
            players=[
                ClubPlayerResponse(
                    id=cp.id,
                    player_profile=PlayerRead.model_validate(cp.player),
                    user=UserRead.model_validate(cp.player.user),
                    joined_at=cp.joined_at
                )
                for cp in club_players
            ],
            total=len(club_players)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/fixtures/{match_id}/playing-xi", response_model=List[PlayingXIResponse])
def set_playing_xi_endpoint(
    match_id: int,
    payload: PlayingXICreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Set Playing XI for a match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    if len(payload.player_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one player must be selected"
        )
    
    try:
        playing_xi_list = set_playing_xi(
            db, 
            match_id, 
            club.id, 
            current_user.id, 
            payload.player_ids,
            payload.captain_id,
            payload.vice_captain_id
        )
        return [PlayingXIResponse.model_validate(pxi) for pxi in playing_xi_list]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/fixtures/{match_id}/playing-xi", response_model=List[PlayingXIResponse])
def get_playing_xi_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get Playing XI for a match"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can access this endpoint"
        )
    
    club = get_club(db, current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found for this manager"
        )
    
    try:
        playing_xi_list = get_playing_xi(db, match_id, club.id)
        return [PlayingXIResponse.model_validate(pxi) for pxi in playing_xi_list]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

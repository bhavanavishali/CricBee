# api/v1/endpoints/player_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.player import (
    PlayerCreate, PlayerUpdate, PlayerRead, PlayerProfileResponse
)
from app.schemas.user import ChangePasswordRequest
from app.schemas.club_manager import (
    ClubPlayerInvitationResponse, ClubPlayerInvitationListResponse, InvitationResponseRequest
)
from app.services.player_service import (
    get_player_profile, create_player_profile, update_player_profile, update_player_profile_photo,
    get_player_current_club, leave_club
)
from app.services.club_service import (
    get_invitations_for_player, accept_club_invitation, reject_club_invitation
)
from app.schemas.club_manager import ClubRead
from app.schemas.user import UserRead
from app.services.auth_service import change_user_password
from app.services.s3_service import generate_presigned_url
from app.utils.jwt import get_current_user  # From the auth utils
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/player-profile", tags=["player_profile"])

@router.get("/", response_model=PlayerProfileResponse)
def get_player_profile_endpoint(request: Request, db: Session = Depends(get_db)):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only players can access this profile"
        )
    return get_player_profile(db, current_user.id)

@router.post("/player", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
def create_player_profile_endpoint(
    payload: PlayerCreate, 
    request: Request, 
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only players can create player profiles"
        )
    try:
        player_profile = create_player_profile(db, payload, current_user.id)
        return player_profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/player/{player_id}", response_model=PlayerRead)
def update_player_profile_endpoint(
    player_id: int,
    payload: PlayerUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only players can update player profiles"
        )
    try:
        player_profile = update_player_profile(db, player_id, payload, current_user.id)
        return player_profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/upload-photo", status_code=status.HTTP_200_OK)
async def upload_profile_photo_endpoint(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can upload profile photos"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        user = update_player_profile_photo(db, current_user.id, file)
        return {
            "message": "Profile photo uploaded successfully",
            "profile_photo": user.profile_photo
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile photo: {str(e)}"
        )


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password_endpoint(
    payload: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    
    try:
        success, message = change_user_password(
            db,
            current_user.id,
            payload.current_password,
            payload.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return {"message": message}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


@router.get("/image-proxy")
def get_image_proxy(request: Request, url: str):
   
    try:
        
        if 'amazonaws.com' in url:
            parts = url.split('.amazonaws.com/')
            if len(parts) > 1:
                object_key = parts[1]
                # Generate presigned URL (valid for 1 hour)
                presigned_url = generate_presigned_url(object_key, expiration=3600)
                return RedirectResponse(url=presigned_url)
        
        
        return RedirectResponse(url=url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image URL: {str(e)}"
        )

# Club invitation endpoints

@router.get("/invitations", response_model=ClubPlayerInvitationListResponse)
def get_player_invitations_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can view invitations"
        )
    
    try:
        invitations = get_invitations_for_player(db, current_user.id)
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

@router.post("/invitations/{invitation_id}/accept", status_code=status.HTTP_200_OK)
def accept_invitation_endpoint(
    invitation_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can accept invitations"
        )
    
    try:
        club_player = accept_club_invitation(db, invitation_id, current_user.id)
        return {
            "message": "Invitation accepted successfully",
            "club_player": {
                "id": club_player.id,
                "joined_at": club_player.joined_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/invitations/{invitation_id}/reject", status_code=status.HTTP_200_OK)
def reject_invitation_endpoint(
    invitation_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can reject invitations"
        )
    
    try:
        invitation = reject_club_invitation(db, invitation_id, current_user.id)
        return {
            "message": "Invitation rejected successfully",
            "invitation_id": invitation.id
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/current-club")
def get_current_club_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can access this endpoint"
        )
    
    try:
        club_info = get_player_current_club(db, current_user.id)
        if not club_info:
            return {"message": "Player is not a member of any club", "club": None}
        
        return {
            "club": ClubRead.model_validate(club_info["club"]),
            "joined_at": club_info["joined_at"]
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/leave-club", status_code=status.HTTP_200_OK)
def leave_club_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players can leave clubs"
        )
    
    try:
        leave_club(db, current_user.id)
        return {"message": "Successfully left the club"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
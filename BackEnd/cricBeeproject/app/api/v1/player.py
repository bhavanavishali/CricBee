# api/v1/endpoints/player_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.player import (
    PlayerCreate, PlayerUpdate, PlayerRead, PlayerProfileResponse
)
from app.schemas.user import ChangePasswordRequest
from app.services.player_service import (
    get_player_profile, create_player_profile, update_player_profile, update_player_profile_photo
)
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
    """Upload player profile photo"""
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
        
        # If URL parsing fails, return the original URL
        return RedirectResponse(url=url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate image URL: {str(e)}"
        )
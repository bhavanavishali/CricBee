# api/v1/endpoints/club_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse, ClubProfileUpdate,
    PlayerSearchResponse, AddPlayerRequest, ClubPlayerResponse, ClubPlayersListResponse
)
from app.services.club_service import (
    get_profile, create_club, update_club, update_club_image, get_club,
    search_player_by_cricb_id, add_player_to_club, get_club_players, remove_player_from_club
)
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
            is_already_in_club=result["is_already_in_club"]
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/club/{club_id}/players", response_model=ClubPlayerResponse, status_code=status.HTTP_201_CREATED)
def add_player_to_club_endpoint(
    club_id: int,
    payload: AddPlayerRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can add players"
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
        
        # Add player to club
        club_player = add_player_to_club(db, club_id, player_profile.id, current_user.id)
        
        # Return response
        return ClubPlayerResponse(
            id=club_player.id,
            player_profile=PlayerRead.model_validate(player_profile),
            user=UserRead.model_validate(player_profile.user),
            joined_at=club_player.joined_at
        )
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

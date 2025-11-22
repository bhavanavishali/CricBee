# api/v1/endpoints/club_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse, ClubProfileUpdate
)
from app.services.club_service import (
    get_profile, create_club, update_club, update_club_image, get_club
)
from app.services.auth_service import update_user
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["club_profile"])

@router.get("/", response_model=ClubProfileResponse)
def get_club_profile_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Fetch the current club manager's profile, including basic details and optional club details.
    Frontend can use this to display details or show create form if club is None.
    """
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
    """
    Create a club for the signed-in club manager (only if none exists).
    """
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

@router.put("/", response_model=ClubProfileResponse)
def update_profile_endpoint(
    payload: ClubProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Update both user details and club details in one request.
    """
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

@router.put("/club/{club_id}", response_model=ClubRead)
def update_club_endpoint(
    club_id: int,
    payload: ClubUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update the club manager's club details (via Edit button).
    Note: no_of_players is not updatable here; it auto-updates elsewhere.
    """
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
    """
    Upload club image to S3 and update club record.
    """
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
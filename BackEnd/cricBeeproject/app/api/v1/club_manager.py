# api/v1/endpoints/club_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
)
from app.services.club_service import (
    get_profile, create_club, update_club
)
from app.utils.jwt import get_current_user  # From the auth utils

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
def create_club_endpoint(
    payload: ClubCreate, 
    request: Request, 
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
    try:
        club = create_club(db, payload, current_user.id)
        return club
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

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
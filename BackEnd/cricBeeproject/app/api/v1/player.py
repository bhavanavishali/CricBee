# api/v1/endpoints/player_profile.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.player import (
    PlayerCreate, PlayerUpdate, PlayerRead, PlayerProfileResponse
)
from app.services.player_service import (
    get_player_profile, create_player_profile, update_player_profile
)
from app.utils.jwt import get_current_user  # From the auth utils

router = APIRouter(prefix="/player-profile", tags=["player_profile"])

@router.get("/", response_model=PlayerProfileResponse)
def get_player_profile_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Fetch the current player's profile, including basic user details and optional player profile details.
    Frontend can use this to display details or show create form if player_profile is None.
    """
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
    """
    Create a player profile for the signed-in player (only if none exists).
    cricb_id is auto-generated and not provided in payload.
    """
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

@router.put("/player/{player_id}", response_model=PlayerRead)
def update_player_profile_endpoint(
    player_id: int,
    payload: PlayerUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update the player's profile details (via Edit button).
    cricb_id cannot be updated.
    """
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
# api/v1/clubmanager/players.py
"""
Player Management Routes
Handles player search, invite, add, remove, and listing operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    PlayerSearchResponse, AddPlayerRequest, ClubPlayerResponse, ClubPlayersListResponse,
    CreatePlayerRequest, CreatePlayerResponse, ClubRead
)
from app.services.clubmanager.club_profile_service import get_club
from app.services.clubmanager.player_management_service import (
    search_player_by_cricb_id, get_club_players, remove_player_from_club, create_new_player
)
from app.services.clubmanager.invitation_service import invite_player_to_club
from app.schemas.player import PlayerRead
from app.schemas.user import UserRead
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["player_management"])


@router.get("/club/{club_id}/search-player/{cricb_id}", response_model=PlayerSearchResponse)
def search_player_by_cricb_endpoint(
    club_id: int,
    cricb_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Search for a player by their CRICB ID"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can search players"
        )
    
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
            is_already_in_any_club=result["is_already_in_any_club"],
            current_club=ClubRead.model_validate(result["current_club"]) if result["current_club"] else None,
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
    """Invite a player to join the club"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can invite players"
        )
    
    try:
        search_result = search_player_by_cricb_id(db, payload.cricb_id, club_id)
        player_profile = search_result["player_profile"]
        
        if search_result["is_already_in_club"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player is already in this club"
            )
        
        if search_result["is_already_in_any_club"]:
            current_club = search_result["current_club"]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player is already a member of '{current_club.club_name}'. Players cannot be members of multiple clubs."
            )
        
        if search_result.get("has_pending_invitation", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation already exists for this player"
            )
        
        invitation = invite_player_to_club(db, club_id, player_profile.id, current_user.id)
        
        return {
            "message": "Invitation sent successfully",
            "invitation_id": invitation.id,
            "player_profile": PlayerRead.model_validate(player_profile),
            "user": UserRead.model_validate(player_profile.user)
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/players-test")
def test_players_endpoint():
    """Test endpoint for player listing"""
    return {
        "message": "Players endpoint is working",
        "players": [
            {
                "id": 1,
                "player_profile": {"cricb_id": "TEST001", "age": 25},
                "user": {"full_name": "Test Player", "email": "test@example.com"},
                "joined_at": "2024-01-01T00:00:00Z"
            }
        ],
        "total": 1
    }


@router.get("/players", response_model=ClubPlayersListResponse)
def get_current_club_players_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all players in the current club manager's club"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view club players"
        )
    
    try:
        club = get_club(db, current_user.id)
        if not club:
            raise ValueError("Club not found for this manager")
        
        club_players = get_club_players(db, club.id, current_user.id)
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


@router.get("/club/{club_id}/players", response_model=ClubPlayersListResponse)
def get_club_players_endpoint(
    club_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all players in a specific club"""
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


@router.delete("/club/{club_id}/players/{player_id}", status_code=status.HTTP_200_OK)
def remove_player_from_club_endpoint(
    club_id: int,
    player_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Remove a player from the club. Cannot remove if player is in any Playing XI for upcoming/live matches."""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can remove players"
        )
    
    try:
        remove_player_from_club(db, club_id, player_id, current_user.id)
        return {
            "message": "Player removed from club successfully",
            "player_id": player_id,
            "club_id": club_id
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove player: {str(e)}"
        )


@router.post("/club/{club_id}/create-player", response_model=CreatePlayerResponse, status_code=status.HTTP_201_CREATED)
def create_new_player_endpoint(
    club_id: int,
    payload: CreatePlayerRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new player and add them to the club"""
    import logging
    import traceback
    
    logging.info(f"Create player request received for club {club_id}")
    logging.info(f"Payload: {payload.model_dump()}")
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can create players"
        )
    
    try:
        club = get_club(db, current_user.id)
        if not club or club.id != club_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Club not found or access denied"
            )
        
        result = create_new_player(db, club_id, payload.model_dump(), current_user.id)
        
        return CreatePlayerResponse(
            player_profile=PlayerRead.model_validate(result["player_profile"]),
            user=UserRead.model_validate(result["user"]),
            club_player=ClubPlayerResponse(
                id=result["club_player"].id,
                player_profile=PlayerRead.model_validate(result["player_profile"]),
                user=UserRead.model_validate(result["user"]),
                joined_at=result["club_player"].joined_at
            ),
            message=result["message"]
        )
        
    except ValueError as e:
        logging.error(f"ValueError in create_new_player: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logging.error(f"Unexpected error in create_new_player: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create player: {str(e)}"
        )


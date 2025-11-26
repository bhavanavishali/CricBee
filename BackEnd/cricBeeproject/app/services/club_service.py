# app/club/services.py
from sqlalchemy.orm import Session, joinedload
from fastapi import UploadFile
from app.models.club import Club
from app.models.user import User, UserRole
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.schemas.club_manager import ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
from app.schemas.user import UserRead
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings

def get_club(db: Session, user_id: int) -> Club | None:
    return db.query(Club).filter(Club.manager_id == user_id).first()

def create_club(db: Session, payload: ClubCreate, user_id: int) -> Club:
    existing_club = get_club(db, user_id)
    if existing_club:
        raise ValueError("Club already exists for this user")
    
    club = Club(
        manager_id=user_id,
        club_name=payload.club_name,
        description=payload.description,
        short_name=payload.short_name,
        location=payload.location,
        club_image=payload.club_image,
        is_active=True,
        no_of_players=0
    )
    db.add(club)
    db.commit()
    db.refresh(club)
    return club

def update_club(db: Session, club_id: int, payload: ClubUpdate, user_id: int) -> Club:
    club = db.query(Club).filter(
        Club.id == club_id, 
        Club.manager_id == user_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(club, field, value)
    
    db.commit()
    db.refresh(club)
    return club

def update_club_image(
    db: Session,
    club_id: int,
    user_id: int,
    uploaded_file: UploadFile,
) -> Club:
  
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == user_id,
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")

    # Upload to S3
    folder = f"{settings.aws_s3_organization_folder}/clubs/{user_id}"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
    # Update club record
    club.club_image = image_url
    db.commit()
    db.refresh(club)
    return club

def get_profile(db: Session, user_id: int) -> ClubProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    club = get_club(db, user_id)
    return ClubProfileResponse(
        user=UserRead.model_validate(user),  
        club=ClubRead.model_validate(club) if club else None
    )


# Player management functions

def search_player_by_cricb_id(db: Session, cricb_id: str, club_id: int = None) -> dict:
   
  
    cricb_id = cricb_id.upper().strip()
    
  
    player_profile = db.query(PlayerProfile).options(
        joinedload(PlayerProfile.user)
    ).filter(PlayerProfile.cricb_id == cricb_id).first()
    
    if not player_profile:
        raise ValueError("Player not found with this CricB ID")
   
    is_already_in_club = False
    if club_id:
        existing = db.query(ClubPlayer).filter(
            ClubPlayer.club_id == club_id,
            ClubPlayer.player_id == player_profile.id
        ).first()
        is_already_in_club = existing is not None
    
    return {
        "player_profile": player_profile,
        "user": player_profile.user,
        "is_already_in_club": is_already_in_club
    }

def add_player_to_club(db: Session, club_id: int, player_id: int, manager_id: int) -> ClubPlayer:
    
   
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
    
    existing = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id == player_id
    ).first()
    if existing:
        raise ValueError("Player is already in this club")
    
    # Create association
    club_player = ClubPlayer(
        club_id=club_id,
        player_id=player_id
    )
    db.add(club_player)
    
    # Update player count
    club.no_of_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count() + 1
    
    db.commit()
    db.refresh(club_player)
    return club_player
def get_club_players(db: Session, club_id: int, manager_id: int) -> list:
    
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    club_players = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id
    ).options(
        joinedload(ClubPlayer.player).joinedload(PlayerProfile.user)
    ).all()
    
    return club_players 

def remove_player_from_club(db: Session, club_id: int, player_id: int, manager_id: int) -> bool:
   
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    club_player = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id == player_id
    ).first()
    
    if not club_player:
        raise ValueError("Player is not in this club")
    
    db.delete(club_player)
    
    # Update player count
    club.no_of_players = max(0, db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count() - 1)
    
    db.commit()
    return True
# app/services/player_service.py
from sqlalchemy.orm import Session
from app.models.player import PlayerProfile
from app.models.user import User
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerRead, PlayerProfileResponse
from app.schemas.user import UserRead
from fastapi import UploadFile
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings

def get_player_profile(db: Session, user_id: int) -> PlayerProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    player_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    return PlayerProfileResponse(
        user=UserRead.model_validate(user),  
        player_profile=PlayerRead.model_validate(player_profile) if player_profile else None
    )

def create_player_profile(db: Session, payload: PlayerCreate, user_id: int) -> PlayerProfile:
    existing_profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == user_id).first()
    if existing_profile:
        raise ValueError("Player profile already exists for this user")
    
    player_profile = PlayerProfile(
        user_id=user_id,
        age=payload.age,
        address=payload.address,
        cricb_id=f"CRICB{user_id:06d}"  # Auto-generate unique cricb_id (e.g., CRICB000001 for user_id=1)
    )
    db.add(player_profile)
    db.commit()
    db.refresh(player_profile)
    return player_profile

def update_player_profile(db: Session, player_id: int, payload: PlayerUpdate, user_id: int) -> PlayerProfile:
    player_profile = db.query(PlayerProfile).filter(
        PlayerProfile.id == player_id, 
        PlayerProfile.user_id == user_id
    ).first()
    if not player_profile:
        raise ValueError("Player profile not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(player_profile, field, value)
    
    db.commit()
    db.refresh(player_profile)
    return player_profile


def update_player_profile_photo(
    db: Session,
    user_id: int,
    uploaded_file: UploadFile,
) -> User:

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # Upload to S3
    folder = f"players/{user_id}/profile"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
    # Update user record
    user.profile_photo = image_url
    db.commit()
    db.refresh(user)
    return user
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import UploadFile
from app.models.club import Club
from app.models.user import User
from app.models.club_player import ClubPlayer
from app.schemas.club_manager import ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
from app.schemas.user import UserRead
from app.services.s3_service import upload_file_to_s3
from app.core.config import settings


def get_club(db: Session, user_id: int) -> Club | None:
    return db.query(Club).filter(Club.manager_id == user_id).first()


def get_club_by_id(db: Session, club_id: int) -> Club | None:
   
    return db.query(Club).options(
        joinedload(Club.manager)
    ).filter(Club.id == club_id).first()


def create_club(db: Session, payload: ClubCreate, user_id: int) -> Club:
    
    existing_club = get_club(db, user_id)
    if existing_club:
        raise ValueError("Club already exists for this user")
    
   
    existing_short_name = db.query(Club).filter(Club.short_name == payload.short_name).first()
    if existing_short_name:
        raise ValueError(f"Club with short name '{payload.short_name}' already exists. Please choose a different short name.")
    
    
    existing_club_name = db.query(Club).filter(Club.club_name == payload.club_name).first()
    if existing_club_name:
        raise ValueError(f"Club with name '{payload.club_name}' already exists. Please choose a different club name.")
    
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
    try:
        db.commit()
        db.refresh(club)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if 'short_name' in error_msg.lower():
            raise ValueError(f"Club with short name '{payload.short_name}' already exists. Please choose a different short name.")
        elif 'club_name' in error_msg.lower():
            raise ValueError(f"Club with name '{payload.club_name}' already exists. Please choose a different club name.")
        else:
            raise ValueError("Failed to create club due to a database constraint violation.")
    return club


def update_club(db: Session, club_id: int, payload: ClubUpdate, user_id: int) -> Club:
    
    club = db.query(Club).filter(
        Club.id == club_id, 
        Club.manager_id == user_id
    ).first()
    if not club:
        raise ValueError("Club not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    
    
    if 'short_name' in update_data:
        existing_short_name = db.query(Club).filter(
            Club.short_name == update_data['short_name'],
            Club.id != club_id
        ).first()
        if existing_short_name:
            raise ValueError(f"Club with short name '{update_data['short_name']}' already exists. Please choose a different short name.")
    
    
    if 'club_name' in update_data:
        existing_club_name = db.query(Club).filter(
            Club.club_name == update_data['club_name'],
            Club.id != club_id
        ).first()
        if existing_club_name:
            raise ValueError(f"Club with name '{update_data['club_name']}' already exists. Please choose a different club name.")
    
    for field, value in update_data.items():
        setattr(club, field, value)
    
    try:
        db.commit()
        db.refresh(club)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if 'short_name' in error_msg.lower():
            raise ValueError(f"Club with short name '{update_data.get('short_name', '')}' already exists. Please choose a different short name.")
        elif 'club_name' in error_msg.lower():
            raise ValueError(f"Club with name '{update_data.get('club_name', '')}' already exists. Please choose a different club name.")
        else:
            raise ValueError("Failed to update club due to a database constraint violation.")
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

    folder = f"{settings.aws_s3_organization_folder}/clubs/{user_id}"
    image_url = upload_file_to_s3(uploaded_file, folder=folder)
    
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


def update_club_verification_status(db: Session, club_id: int) -> Club:
    #minimum 3 players required)
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise ValueError("Club not found")
    
    
    player_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count()
    
    
    club.club_is_verified = player_count >= 3
    
    db.commit()
    db.refresh(club)
    return club


def refresh_club_player_count(db: Session, manager_id: int) -> dict:
    
    club = db.query(Club).filter(Club.manager_id == manager_id).first()
    if not club:
        raise ValueError("Club not found")
    
    
    actual_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count()
    
    
    old_count = club.no_of_players
    old_verified = club.club_is_verified
    
    
    club.no_of_players = actual_count
    
   
    club.club_is_verified = actual_count >= 3
    
    db.commit()
    db.refresh(club)
    
    return {
        "club_id": club.id,
        "club_name": club.club_name,
        "old_count": old_count,
        "new_count": actual_count,
        "was_fixed": old_count != actual_count,
        "verification_changed": old_verified != club.club_is_verified,
        "is_verified": club.club_is_verified
    }


def get_dashboard_stats(db: Session, user_id: int) -> dict:
   
    club = get_club(db, user_id)
    if not club:
        raise ValueError("Club not found")
    
    
    player_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count()
    
    
    from app.models.organizer.tournament import TournamentEnrollment
    tournament_count = db.query(TournamentEnrollment).filter(TournamentEnrollment.club_id == club.id).count()
    
    return {
        "player_count": player_count,
        "tournament_count": tournament_count,
        "club_id": club.id
    }


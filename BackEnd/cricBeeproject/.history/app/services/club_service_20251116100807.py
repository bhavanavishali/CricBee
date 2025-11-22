# app/club/services.py
from sqlalchemy.orm import Session
from app.models.club import Club
from app.models.user import User, UserRole
from app.schemas.club_manager import ClubCreate, ClubUpdate, ClubRead, ClubProfileResponse
from app.schemas.user import UserRead

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

def get_profile(db: Session, user_id: int) -> ClubProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    club = get_club(db, user_id)
    return ClubProfileResponse(
        user=UserRead.model_validate(user),  
        club=ClubRead.model_validate(club) if club else None
    )
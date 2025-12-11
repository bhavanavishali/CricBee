

from sqlalchemy.orm import Session, joinedload
from app.models.user import User, UserRole
from app.models.organizer import OrganizationDetails
from app.models.club import Club
from typing import List
from app.schemas.admin import UserListItem

def get_all_users_except_admin(db: Session) -> List[UserListItem]:
    users = db.query(User).options(
        joinedload(User.organization),
        joinedload(User.club)
    ).filter(
        User.role != UserRole.ADMIN
    ).order_by(User.id.desc()).all()
    
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "organization_name": None,
            "club_name": None
        }
        
     
        
        if (user.role == UserRole.ORGANIZER or str(user.role) == "Organizer") and user.organization:
            user_dict["organization_name"] = user.organization.organization_name
        
      
        if (user.role == UserRole.CLUB_MANAGER or str(user.role) == "Club Manager") and user.club:
            user_dict["club_name"] = user.club.club_name
        
        result.append(UserListItem(**user_dict))
    
    return result


def update_user_status(db: Session, user_id: int, is_active: bool) -> UserListItem | None:
   
    user = db.query(User).options(
        joinedload(User.organization),
        joinedload(User.club)
    ).filter(User.id == user_id).first()
    
    if not user:
        return None
    
    if user.role == UserRole.ADMIN:
        return None
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
   
    db.refresh(user, ["organization", "club"])
    
   
    user_dict = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "organization_name": None,
        "club_name": None
    }
    
  
    if (user.role == UserRole.ORGANIZER or str(user.role) == "Organizer") and user.organization:
        user_dict["organization_name"] = user.organization.organization_name
 
    if (user.role == UserRole.CLUB_MANAGER or str(user.role) == "Club Manager") and user.club:
        user_dict["club_name"] = user.club.club_name
    
    return UserListItem(**user_dict)
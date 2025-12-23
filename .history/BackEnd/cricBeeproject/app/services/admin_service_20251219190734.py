

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.models.user import User, UserRole
from app.models.organizer import OrganizationDetails
from app.models.club import Club
from typing import List, Tuple, Optional, Dict
from app.schemas.admin import UserListItem

def get_all_users_except_admin(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    role_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None
) -> Tuple[List[UserListItem], int, Dict[str, int]]:
    # Base query for stats (all non-admin users)
    base_query = db.query(User).filter(User.role != UserRole.ADMIN)

    total_users = base_query.count()
    total_active = base_query.filter(User.is_active == True, User.is_verified == True).count()
    total_inactive = base_query.filter(User.is_active == False).count()
    total_organizers = base_query.filter(User.role == UserRole.ORGANIZER).count()
    total_clubs = db.query(Club).count()

    stats = {
        "total_users": total_users,
        "total_active": total_active,
        "total_inactive": total_inactive,
        "total_organizers": total_organizers,
        "total_clubs": total_clubs,
    }

    # Query for paginated & filtered list
    query = base_query.options(
        joinedload(User.organization),
        joinedload(User.club)
    )

    if search:
        search_term = f"%{search.lower()}%"

        query = query.outerjoin(
            OrganizationDetails, User.id == OrganizationDetails.user_id
        ).outerjoin(
            Club, User.id == Club.manager_id
        ).filter(
            or_(
                func.lower(User.full_name).like(search_term),
                func.lower(User.email).like(search_term),
                func.lower(OrganizationDetails.organization_name).like(search_term),
                func.lower(Club.club_name).like(search_term)
            )
        )

    if role_filter:
        role_filter_lower = role_filter.lower()
        if role_filter_lower == "organizer":
            query = query.filter(User.role == UserRole.ORGANIZER)
        elif role_filter_lower in ["manager", "club_manager"]:
            query = query.filter(User.role == UserRole.CLUB_MANAGER)
        elif role_filter_lower == "player":
            query = query.filter(User.role == UserRole.PLAYER)
        elif role_filter_lower == "fan":
            query = query.filter(User.role == UserRole.FAN)

    if status_filter:
        status_filter_lower = status_filter.lower()
        if status_filter_lower == "active":
            query = query.filter(User.is_active == True, User.is_verified == True)
        elif status_filter_lower == "inactive":
            query = query.filter(User.is_active == False)
        elif status_filter_lower == "pending":
            query = query.filter(User.is_verified == False)

    total = query.count()

    users = query.order_by(User.id.desc()).offset(skip).limit(limit).all()

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

    return result, total, stats
8

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
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import UserListItem, UserStatusUpdate, UserListResponse
from app.services.admin import get_all_users_except_admin, update_user_status
from app.utils.admin_dependencies import get_current_admin_user
from typing import Optional

router = APIRouter()


# User Management Endpoints
@router.get("/users", response_model=UserListResponse)
def list_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    users, total, stats = get_all_users_except_admin(
        db,
        skip=skip,
        limit=limit,
        role_filter=role,
        status_filter=status,
        search=search
    )
    
    return UserListResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit,
        stats=stats
    )


@router.patch("/users/{user_id}/status", response_model=UserListItem)
def update_user_active_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
   
    user = update_user_status(db, user_id, payload.is_active)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or cannot modify admin users"
        )
    
    return user


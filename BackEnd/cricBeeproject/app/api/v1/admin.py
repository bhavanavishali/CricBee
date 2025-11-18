from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import UserListItem, UserStatusUpdate
from app.services.admin_service import get_all_users_except_admin, update_user_status
from app.utils.admin_dependencies import get_current_admin_user  # You'll need to create this
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserListItem])
def list_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all users except admins.
    Only accessible by admin users.
    """
    users = get_all_users_except_admin(db)
    return users


@router.patch("/users/{user_id}/status", response_model=UserListItem)
def update_user_active_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Block or unblock a user by updating their is_active status.
    Only accessible by admin users.
    Cannot modify admin users.
    """
    user = update_user_status(db, user_id, payload.is_active)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or cannot modify admin users"
        )
    
    return user
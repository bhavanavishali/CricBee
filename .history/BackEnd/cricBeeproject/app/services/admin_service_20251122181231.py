from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from typing import List

def get_all_users_except_admin(db: Session) -> List[User]:
 
    users = db.query(User).filter(
        User.role != UserRole.ADMIN
    ).order_by(User.id.desc()).all()
    
    return users


def update_user_status(db: Session, user_id: int, is_active: bool) -> User | None:
<<<<<<< HEAD
    """
    Update user's active status (block/unblock).
    Returns None if user not found or if trying to modify an admin.
    """
=======
    
>>>>>>> feature/player
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return None
    
<<<<<<< HEAD
    # Prevent modifying admin users
=======
    
>>>>>>> feature/player
    if user.role == UserRole.ADMIN:
        return None
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
    return user
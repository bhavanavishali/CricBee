
# app/utils/dependencies.py
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.utils.jwt import verify_token, JWTError

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
<<<<<<< HEAD
    """
    Get current user from access token cookie.
    """
=======
 
>>>>>>> feature/player
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = verify_token(access_token, token_type="access")
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
<<<<<<< HEAD
    """
    Verify that the current user is an admin.
    """
=======
 
>>>>>>> feature/player
    if current_user.role != UserRole.ADMIN or not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user
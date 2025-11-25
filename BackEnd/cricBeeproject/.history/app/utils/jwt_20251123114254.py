"""
app/utils/jwt.py
JWT token creation, verification, and authentication utilities
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# Security scheme
security = HTTPBearer()

# JWT Algorithm
ALGORITHM = "HS256"

# Token expiration times
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
REFRESH_TOKEN_EXPIRE_HOURS = 168  # 7 days

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a plain password"""
    return pwd_context.hash(password)

def create_access_token(user_id: int, additional_claims: Optional[dict] = None, 
                        expires_delta: Optional[timedelta] = None) -> str:
    
    to_encode = {"sub": str(user_id)}
    
    # Add any additional claims
    if additional_claims:
        to_encode.update(additional_claims)

    if additional_claims and "is_superuser" in additional_claims:
        to_encode["is_superuser"] = additional_claims["is_superuser"]
    
    
    if expires_delta:
        expire = datetime.now(timezone.utc)+ expires_delta
    else:
        expire = datetime.now(timezone.utc)+ timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: int, additional_claims: Optional[dict] = None,
                         expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token
    
    Args:
        user_id: User ID to include in token
        additional_claims: Optional additional claims to include
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = {"sub": str(user_id)}
    
    # Add any additional claims
    if additional_claims:
        to_encode.update(additional_claims)
    
    if additional_claims and "is_superuser" in additional_claims:
        to_encode["is_superuser"] = additional_claims["is_superuser"]
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=REFRESH_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        token_type: Expected token type ('access' or 'refresh')
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            raise JWTError("Invalid token type")
        return payload
    except JWTError:
        raise JWTError("Invalid or expired token")


def get_cookie_params(is_prod: bool = False) -> dict:
    """
    Get cookie parameters for token storage
    
    Args:
        is_prod: Whether running in production
        
    Returns:
        Dictionary of cookie parameters
    """
    base_params = {
        "httponly": True,
        "samesite": "lax",
    }
    if is_prod:
        base_params["secure"] = True
    return base_params


from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Sessiony6
from app.models.user import User
from app.utils.jwt import verify_token, JWTError

def get_current_user(request: Request, db: Session) -> User:
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    try:
        payload = verify_token(access_token, token_type="access")
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer active")
        
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
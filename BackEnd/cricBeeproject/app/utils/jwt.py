from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings
from app.models.user import User

def create_access_token(user: User) -> str:
    to_encode = {
        "sub": user.email,
        "role": user.role.value,
        "id": user.id
    }
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MIN)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    

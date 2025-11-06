from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.domain.user import UserSignUp
from app.utils.hashing import hash_password, verify_password

def register_user(db: Session, payload: UserSignUp) -> User | None:
    # Check if email already exists
    if db.query(User).filter(User.email == payload.email).first():
        return None
    
    # Check if phone already exists
    if db.query(User).filter(User.phone == payload.phone).first():
        return None
    
    # Convert role string to UserRole enum
    role_map = {
        "Organizer": UserRole.ORGANIZER,
        "Club Manager": UserRole.CLUB_MANAGER,
        "Player": UserRole.PLAYER,
        "Fan": UserRole.FAN
    }
    
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=role_map[payload.role]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("*****************",user)
    return user

def authenticate(db: Session, email_or_phone: str, password: str) -> User | None:
    # Check if it's an email or phone number
    is_email = "@" in email_or_phone
    
    if is_email:
        user = db.query(User).filter(User.email == email_or_phone).first()
    else:
        user = db.query(User).filter(User.phone == email_or_phone).first()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    print("*************",user)
    return user
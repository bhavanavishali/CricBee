from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserSignUp
from app.utils.hashing import hash_password, verify_password
from app.utils.otp import generate_otp, store_otp_in_redis,verify_otp_from_redis
from app.services.email_service import send_otp_email
from app.core.redis_config import get_redis
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserSignUp,UserUpdate
from app.utils.hashing import hash_password, verify_password
from app.utils.otp import generate_otp, store_otp_in_redis, verify_otp_from_redis
from app.core.redis_config import get_redis
import json

def check_user_exists(db: Session, email: str, phone: str) -> dict:
    
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        return {"exists": True, "field": "email"}
    
    existing_phone = db.query(User).filter(User.phone == phone).first()
    if existing_phone:
        return {"exists": True, "field": "phone"}
    
    return {"exists": False, "field": None}


def store_pending_user(email: str, user_data: dict, otp: str) -> bool:
    
    try:
        redis_client = get_redis()
        
        
        user_key = f"pending_user:{email}"
        
        
        redis_client.setex(
            user_key,
            900,  # 15 minutes in seconds
            json.dumps(user_data)
        )
        
        
        otp_key = f"otp:{email}"
        redis_client.setex(otp_key, 600, otp)  # 10 minutes
        
        return True
    except Exception as e:
        print(f"Error storing pending user: {e}")
        return False


def register_pending_user(db: Session, payload: UserSignUp) -> tuple[bool, str, str | None]:
    
   
    check_result = check_user_exists(db, payload.email, payload.phone)
    if check_result["exists"]:
        field = check_result["field"]
        return False, f"{field.capitalize()} already registered", None
    
   
    redis_client = get_redis()
    pending_key = f"pending_user:{payload.email}"
    if redis_client.exists(pending_key):
        
        otp = generate_otp(6)
        store_otp_in_redis(redis_client, payload.email, otp, expire_minutes=10)
        return True, "OTP resent. Please verify your email.", otp
    
    # Convert role string to UserRole enum
    role_map = {
        "Admin": UserRole.ADMIN,
        "Organizer": UserRole.ORGANIZER,
        "Club Manager": UserRole.CLUB_MANAGER,
        "Player": UserRole.PLAYER,
        "Fan": UserRole.FAN
    }
    
   
    user_data = {
        "full_name": payload.full_name,
        "email": payload.email,
        "phone": payload.phone,
        "hashed_password": hash_password(payload.password),
        "role": role_map[payload.role].value,
        "is_superuser": payload.role == "Admin"
    }
    otp = generate_otp(6)
    
 
    if store_pending_user(payload.email, user_data, otp):
        return True, "OTP sent to your email. Please verify.", otp
    else:
        return False, "Failed to process registration. Please try again.", None


def verify_and_create_user(db: Session, email: str, otp: str) -> tuple[bool, str, User | None]:
    
    
   
    try:
        redis_client = get_redis()
        
    
        if not verify_otp_from_redis(redis_client, email, otp):
            return False, "Invalid or expired OTP", None
        
   
        user_key = f"pending_user:{email}"
        user_data_json = redis_client.get(user_key)
        
        if not user_data_json:
            return False, "Registration session expired. Please sign up again.", None
        

        user_data = json.loads(user_data_json)
        

        check_result = check_user_exists(db, user_data["email"], user_data["phone"])
        if check_result["exists"]:
            # Clean up Redis
            redis_client.delete(user_key)
            redis_client.delete(f"otp:{email}")
            return False, f"{check_result['field'].capitalize()} already registered", None
        
 
        user = User(
            full_name=user_data["full_name"],
            email=user_data["email"],
            phone=user_data["phone"],
            hashed_password=user_data["hashed_password"],
            role=UserRole(user_data["role"]),
            is_superuser=user_data["is_superuser"],
            is_verified=True 
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Clean up Redis after successful user creation
        redis_client.delete(user_key)
        redis_client.delete(f"otp:{email}")
        
        return True, "Email verified successfully. You can now sign in.", user
        
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        return False, "Failed to create user. Please try again.", None


def authenticate(db: Session, email_or_phone: str, password: str) -> User | None:
   
    # Check if it's an email or phone number
    is_email = "@" in email_or_phone
    
    if is_email:
        user = db.query(User).filter(User.email == email_or_phone).first()
    else:
        user = db.query(User).filter(User.phone == email_or_phone).first()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    
   
    if not user.is_verified:
        return None
    
    return user


def resend_otp_for_pending_user(email: str) -> tuple[bool, str, str | None]:
<<<<<<< HEAD
    """
    Resend OTP for a pending user registration
    Returns: (success: bool, message: str, otp: str | None)
    """
    try:
        redis_client = get_redis()
        
        # Check if pending user exists
=======

    try:
        redis_client = get_redis()
        
        
>>>>>>> feature/player
        user_key = f"pending_user:{email}"
        if not redis_client.exists(user_key):
            return False, "No pending registration found. Please sign up again.", None
        
<<<<<<< HEAD
        # Generate new OTP
        otp = generate_otp(6)
        
        # Store new OTP
=======
       
        otp = generate_otp(6)
        
    
>>>>>>> feature/player
        if store_otp_in_redis(redis_client, email, otp, expire_minutes=10):
            return True, "OTP resent successfully", otp
        else:
            return False, "Failed to resend OTP", None
            
    except Exception as e:
        print(f"Error resending OTP: {e}")
<<<<<<< HEAD
        return False, "Failed to resend OTP", None
=======
        return False, "Failed to resend OTP", None
    

def update_user(db:Session ,user_id:int,payload:UserUpdate)-> User:
    user=db.query(User).filter(User.id==user_id).first()
    if not user:
        raise ValueError("User not found")
    update_data=payload.dict(exclude_unset=True)
    for field,value in update_data.items():
        setattr(user,field,value)

    db.commit()
    db.refresh(user)
    return user
>>>>>>> feature/player

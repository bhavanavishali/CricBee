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
import redis

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
        
        
        redis_client.delete(user_key)
        redis_client.delete(f"otp:{email}")
        
        return True, "Email verified successfully. You can now sign in.", user
        
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        return False, "Failed to create user. Please try again.", None


def authenticate(db: Session, email_or_phone: str, password: str) -> User | None:
   
   
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

    try:
        redis_client = get_redis()
        
        
        user_key = f"pending_user:{email}"
        if not redis_client.exists(user_key):
            return False, "No pending registration found. Please sign up again.", None
        
       
        otp = generate_otp(6)
        
        print("****",otp)
        if store_otp_in_redis(redis_client, email, otp, expire_minutes=10):
            return True, "OTP resent successfully", otp
        else:
            return False, "Failed to resend OTP", None
            
    except Exception as e:
        print(f"Error resending OTP: {e}")
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


import secrets
from datetime import datetime


def generate_password_reset_token() -> str:

    return secrets.token_urlsafe(32)


def store_password_reset_token(email: str, token: str, expire_hours: int = 1) -> bool:

    try:
        redis_client = get_redis()
        
        redis_client.ping()
        
        token_key = f"password_reset:{token}"
        token_data = {
            "email": email,
            "created_at": datetime.now().isoformat()
        }
        
      
        result = redis_client.setex(
            token_key,
            expire_hours * 3600, 
            json.dumps(token_data)
        )
        
        if result:
            return True
        else:
            print(f"Failed to store password reset token in Redis")
            return False
    except redis.ConnectionError as e:
        print(f"Redis connection error: {e}")
        return False
    except redis.TimeoutError as e:
        print(f"Redis timeout error: {e}")
        return False
    except Exception as e:
        print(f"Error storing password reset token: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_password_reset_token(token: str) -> tuple[bool, str | None]:
  
    try:
        redis_client = get_redis()
        token_key = f"password_reset:{token}"
        token_data_json = redis_client.get(token_key)
        
        if not token_data_json:
            return False, None
        
        token_data = json.loads(token_data_json)
        email = token_data.get("email")
        
       
        redis_client.delete(token_key)
        
        return True, email
    except Exception as e:
        print(f"Error verifying password reset token: {e}")
        return False, None


def reset_user_password(db: Session, email: str, new_password: str) -> tuple[bool, str]:
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return False, "User not found"
        
        
        user.hashed_password = hash_password(new_password)
        db.commit()
        
        return True, "Password reset successfully"
    except Exception as e:
        db.rollback()
        print(f"Error resetting password: {e}")
        return False, "Failed to reset password"


def change_user_password(db: Session, user_id: int, current_password: str, new_password: str) -> tuple[bool, str]:
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "User not found"
        
       
        if not verify_password(current_password, user.hashed_password):
            return False, "Current password is incorrect"
        
       
        user.hashed_password = hash_password(new_password)
        db.commit()
        
        return True, "Password changed successfully"
    except Exception as e:
        db.rollback()
        print(f"Error changing password: {e}")
        return False, "Failed to change password"
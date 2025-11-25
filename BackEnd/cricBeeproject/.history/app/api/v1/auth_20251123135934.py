from fastapi import APIRouter, Depends, HTTPException, status,Header,Response,Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserSignUp, UserSignIn, UserRead, UserLoginResponse
from app.services.auth_service import *
from app.utils.jwt import create_access_token
from app.utils.jwt import create_access_token, create_refresh_token, verify_token, JWTError, get_cookie_params
router = APIRouter(prefix="/auth", tags=["auth"])


ACCESS_TOKEN_EXPIRE_MINUTES = 60  
REFRESH_TOKEN_EXPIRE_HOURS = 168


from app.utils.otp import *
from app.services.email_service import send_otp_email
from app.core.redis_config import get_redis
from app.schemas.user import OTPVerify, OTPResend
from app.services.auth_service import *


@router.post("/signup", status_code=status.HTTP_200_OK)
async def signup(payload: UserSignUp, db: Session = Depends(get_db)):
    """
    Initiate user signup - validates data and sends OTP.
    User is NOT created in database until OTP verification.
    """
    success, message, otp = register_pending_user(db, payload)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Send OTP email
    email_sent = await send_otp_email(payload.email, otp, payload.full_name)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please try again."
        )
    
    return {
        "message": message,
        "email": payload.email,
        "otp_sent": True
    }


@router.post("/verify-otp", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
  
    success, message, user = verify_and_create_user(db, payload.email, payload.otp)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return user


@router.post("/resend-otp", status_code=status.HTTP_200_OK)
async def resend_otp(payload: OTPResend, db: Session = Depends(get_db)):
    """
    Resend OTP for pending user registration.
    """
    success, message, otp = resend_otp_for_pending_user(payload.email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Retrieve pending user data to get full name
    from app.core.redis_config import get_redis
    import json
    
    redis_client = get_redis()
    user_key = f"pending_user:{payload.email}"
    user_data_json = redis_client.get(user_key)
    
    if user_data_json:
        user_data = json.loads(user_data_json)
        full_name = user_data.get("full_name", "User")
    else:
        full_name = "User"
    
    # Send OTP email
    email_sent = await send_otp_email(payload.email, otp, full_name)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return {
        "message": message,
        "email": payload.email,
        "otp_sent": True
    }


@router.post("/signin", response_model=UserRead)
def signin(payload: UserSignIn, db: Session = Depends(get_db), response: Response = None):
    """
    Sign in - only for verified users who have completed OTP verification.
    """
    user = authenticate(db, payload.email_or_phone, payload.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or email not verified"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(
        user_id=user.id,
        additional_claims={"is_superuser": user.is_superuser}
    )
    refresh_token = create_refresh_token(
        user_id=user.id,
        additional_claims={"is_superuser": user.is_superuser}
    )
    
    # Set httpOnly cookies
    cookie_params = get_cookie_params(is_prod=False)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **cookie_params
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_HOURS * 3600,
        **cookie_params
    )
    
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, db: Session = Depends(get_db), response: Response = None):
    """
    Log out the user by deleting httpOnly cookies.
    """
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided"
        )
    
    try:
        payload = verify_token(access_token, token_type="access")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token"
            )
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer active"
            )
        
        # Delete cookies
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        
    except JWTError:
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )


@router.post("/refresh", response_model=UserRead)
def refresh_token_endpoint(request: Request, db: Session = Depends(get_db), response: Response = None):
    """
    Refresh tokens via cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = verify_token(refresh_token, token_type="refresh")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User no longer active")
        
        # Create new tokens
        # CORRECT - Should be:
        new_access_token = create_access_token(
    user_id=user.id,
    additional_claims={"is_superuser": user.is_superuser}
)
new_refresh_token = create_refresh_token(
    user_id=user.id,
    additional_claims={"is_superuser": user.is_superuser}
)
        
        # Set new cookies
        cookie_params = get_cookie_params(is_prod=False)
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            **cookie_params
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            max_age=REFRESH_TOKEN_EXPIRE_HOURS * 3600,
            **cookie_params
        )
        
        return user
    
    except JWTError:
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
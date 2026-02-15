from fastapi import APIRouter, Depends, HTTPException, status,Header,Response,Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserSignUp, UserSignIn, UserRead, UserLoginResponse
from app.services.auth_service import *
from app.utils.jwt import create_access_token
from app.utils.jwt import create_access_token, create_refresh_token, verify_token, JWTError, get_cookie_params
import redis
router = APIRouter(prefix="/auth", tags=["auth"])


ACCESS_TOKEN_EXPIRE_MINUTES = 60  
REFRESH_TOKEN_EXPIRE_HOURS = 168


from app.utils.otp import *
from app.services.email_service import send_otp_email, send_password_reset_email
from app.core.redis_config import get_redis
from app.schemas.user import OTPVerify, OTPResend, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import (
    generate_password_reset_token,
    store_password_reset_token,
    verify_password_reset_token,
    reset_user_password
)
from app.core.config import settings


@router.post("/signup", status_code=status.HTTP_200_OK)
async def signup(payload: UserSignUp, db: Session = Depends(get_db)):

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
 
    success, message, otp = resend_otp_for_pending_user(payload.email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
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
def signin(payload: UserSignIn, response: Response, db: Session = Depends(get_db)):
   
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
    
   
    cookie_params = get_cookie_params(is_prod=False)
    cookie_params["path"] = "/"
    
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
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
   
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
        
        
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        
    except JWTError:
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )


@router.post("/refresh", response_model=UserRead)
def refresh_token_endpoint(request: Request, response: Response, db: Session = Depends(get_db)):
 
    import logging
    logger = logging.getLogger(__name__)
    
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh endpoint called without refresh_token cookie")
        # Clear any existing cookies
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = verify_token(refresh_token, token_type="refresh")
        user_id_str = payload.get("sub")
        if user_id_str is None:
            logger.warning("Refresh token missing 'sub' claim")
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format in refresh token: {user_id_str}")
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User {user_id} not found during token refresh")
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            raise HTTPException(status_code=401, detail="User no longer active")
        
        if not user.is_active:
            logger.warning(f"User {user_id} is inactive during token refresh")
            response.delete_cookie("access_token", path="/")
            response.delete_cookie("refresh_token", path="/")
            raise HTTPException(status_code=401, detail="User account is inactive")
        
        # Create new tokens
        new_access_token = create_access_token(
            user_id=user.id,
            additional_claims={"is_superuser": user.is_superuser}
        )
        new_refresh_token = create_refresh_token(
            user_id=user.id,
            additional_claims={"is_superuser": user.is_superuser}
        )
        
        
        cookie_params = get_cookie_params(is_prod=False)
        cookie_params["path"] = "/"
        
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
        
        logger.info(f"Successfully refreshed tokens for user {user_id}")
        return user
    
    except JWTError as e:
        logger.warning(f"JWT error during token refresh: {str(e)}")
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}", exc_info=True)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise HTTPException(status_code=401, detail="Token refresh failed")


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    
    
    user = db.query(User).filter(User.email == payload.email).first()
    
   
    if not user:
        return {
            "message": "If an account with that email exists, we've sent a password reset link."
        }
    
    if not user.is_verified:
        return {
            "message": "If an account with that email exists, we've sent a password reset link."
        }
    
   
    reset_token = generate_password_reset_token()
    
    
    try:
        token_stored = store_password_reset_token(payload.email, reset_token, expire_hours=1)
        
        if not token_stored:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to store password reset token for email: {payload.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate reset token. Please ensure Redis is running and try again."
            )
    except redis.ConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again later."
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error storing password reset token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate reset token. Please try again later."
        )
    
 
    frontend_url = getattr(settings, "frontend_url", "http://localhost:5173")
    email_sent = await send_password_reset_email(
        payload.email,
        reset_token,
        user.full_name,
        frontend_url
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email"
        )
    
    return {
        "message": "If an account with that email exists, we've sent a password reset link."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
  
    
    is_valid, email = verify_password_reset_token(payload.token)
    
    if not is_valid or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    
    success, message = reset_user_password(db, email, payload.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return {
        "message": "Password reset successfully. You can now sign in with your new password."
    }
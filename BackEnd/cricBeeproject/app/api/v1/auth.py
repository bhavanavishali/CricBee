from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.domain.user import UserSignUp, UserSignIn, UserRead, UserLoginResponse
from app.services.auth_service import register_user, authenticate
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignUp, db: Session = Depends(get_db)):
    """
    Sign up a new user with role selection.
    All fields are required including acceptance of terms and conditions.
    """
    user = register_user(db, payload)
    if not user:
        # Check which field caused the conflict
        existing_email = db.query(User).filter(User.email == payload.email).first()
        existing_phone = db.query(User).filter(User.phone == payload.phone).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email already registered"
            )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Phone number already registered"
            )
    
    return user

@router.post("/signin", response_model=UserLoginResponse)
def signin(payload: UserSignIn, db: Session = Depends(get_db)):
    """
    Sign in with email or phone number and password.
    Returns access token and user role for frontend redirection.
    """
    user = authenticate(db, payload.email_or_phone, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    token = create_access_token(user)
    print("*************",user.role.value)
    print("*************",token)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_role": user.role.value
    }
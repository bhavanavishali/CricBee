from fastapi import APIRouter, Depends, HTTPException, status,Header,Response,Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserSignUp, UserSignIn, UserRead, UserLoginResponse
from app.services.auth_service import register_user, authenticate
from app.utils.jwt import create_access_token
from app.utils.jwt import create_access_token, create_refresh_token, verify_token, JWTError, get_cookie_params
router = APIRouter(prefix="/auth", tags=["auth"])


ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour as requested
REFRESH_TOKEN_EXPIRE_HOURS = 168

@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignUp, db: Session = Depends(get_db)):
    """
    Sign up a new user with role selection.
    All fields are required including acceptance of terms and conditions.
    """
    user = register_user(db, payload)
    if not user:
        
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
@router.post("/signin", response_model=UserRead)  # Now returns only UserRead
def signin(payload: UserSignIn, db: Session = Depends(get_db), response: Response = None):
    """
    Sign in and set httpOnly cookies for tokens.
    """
    user = authenticate(db, payload.email_or_phone, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    

    access_token = create_access_token(user_id=user.id,
                                       additional_claims={"is_superuser": user.is_superuser})
    refresh_token = create_refresh_token(user_id=user.id,
                                         additional_claims={"is_superuser": user.is_superuser})

    # Set httpOnly cookies
    cookie_params = get_cookie_params(is_prod=False)  # Set is_prod=True in env for prod
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Seconds
        **cookie_params
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_HOURS * 3600,  # Seconds
        **cookie_params
    )
    
    return user  # Only user data in body




@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    db: Session = Depends(get_db),
    response: Response = None
):
    """
    Log out the user by invalidating and deleting httpOnly cookies for tokens.
    Verifies the access token before proceeding for security.
    """
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token provided")
    
    try:
        payload = verify_token(access_token, token_type="access")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer active")
        
        # Delete cookies
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        
    except JWTError:
        # Even on invalid token, delete cookies to clear client-side
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
    



@router.post("/refresh", response_model=UserRead)
def refresh_token_endpoint(request: Request, db: Session = Depends(get_db), response: Response = None):
    """
    Refresh tokens via cookie. Sets new httpOnly cookies.
    """
    refresh_token = request.cookies.get("refresh_token")  # Read from cookie
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
        
        # Rotate tokens
        new_access_token = create_access_token({"sub": str(user.id)})
        new_refresh_token = create_refresh_token({"sub": str(user.id)})
        
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
        # Invalidate old cookies on failure
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

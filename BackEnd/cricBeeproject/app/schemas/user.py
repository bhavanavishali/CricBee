from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Literal
from app.models.user import UserRole
from typing import Optional
from datetime import datetime

class UserSignUp(BaseModel):
    full_name: str = Field(..., min_length=1, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")
    phone: str = Field(..., description="10-digit phone number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Confirm password must match")
    role: Literal["Admin","Organizer", "Club Manager", "Player", "Fan"] = Field(..., description="User role")
    
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
    
        cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not cleaned.isdigit() or len(cleaned) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return cleaned
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v
    
    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserSignIn(BaseModel):
    email_or_phone: str = Field(..., description="Email address or 10-digit phone number")
    password: str = Field(..., min_length=1, description="Password")
    
    @field_validator("email_or_phone")
    @classmethod
    def validate_email_or_phone(cls, v: str) -> str:
        cleaned = v.strip()
        
        if "@" in cleaned:
           
            if not cleaned.count("@") == 1 or "." not in cleaned.split("@")[1]:
                raise ValueError("Invalid email format")
        else:
      
            phone_cleaned = cleaned.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not phone_cleaned.isdigit() or len(phone_cleaned) != 10:
                raise ValueError("Phone number must be exactly 10 digits")
        return cleaned

class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole
    created_at: datetime
    is_superuser: Optional[bool] = None
    
    class Config:
        from_attributes = True

class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_role: str




class OTPVerify(BaseModel):
    email: EmailStr = Field(..., description="Email address used during signup")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    
    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("OTP must contain only digits")
        if len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v

class OTPResend(BaseModel):
    email: EmailStr = Field(..., description="Email address to resend OTP")

class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole
    is_superuser: Optional[bool] = None
    is_verified: bool = False  # ADD THIS
    
    class Config:
        from_attributes = True


class SignUpResponse(BaseModel):
    message: str
    email: EmailStr
    otp_sent: bool

class OTPVerifyResponse(BaseModel):
    message: str
    email: EmailStr
    is_verified: bool


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if v:
    
            cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not cleaned.isdigit() or len(cleaned) != 10:
                raise ValueError("Phone number must be exactly 10 digits")
            return cleaned
        return v
    
    
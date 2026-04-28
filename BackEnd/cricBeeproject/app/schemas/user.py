from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Literal
from app.models.user import UserRole
from typing import Optional
from datetime import datetime
import re


def _validate_password_strength(password: str, field_name: str = "Password") -> str:
    if len(password) < 8:
        raise ValueError(f"{field_name} must be at least 8 characters long")

    if not re.search(r"[A-Z]", password):
        raise ValueError(f"{field_name} must contain at least 1 uppercase letter")

    if not re.search(r"[a-z]", password):
        raise ValueError(f"{field_name} must contain at least 1 lowercase letter")

    if not re.search(r"\d", password):
        raise ValueError(f"{field_name} must contain at least 1 number")

    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError(f"{field_name} must contain at least 1 special character")

    return password

class UserSignUp(BaseModel):
    full_name: str = Field(..., min_length=2, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")
    phone: str = Field(..., description="10-digit phone number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Confirm password must match")
    role: Literal["Organizer", "Club Manager", "Player", "Fan"] = Field(..., description="User role")
    
    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        
        cleaned = v.strip()
       
        
        if not cleaned:
            raise ValueError("Full name cannot be empty")
        
       
        if not all(char.isalpha() or char.isspace() for char in cleaned):
           
            raise ValueError("Full name must contain only alphabetic characters and spaces")
        
        #
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        
        print(f"DEBUG: Full name validation passed: '{cleaned}'")
        return cleaned
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Clean phone number
        cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        print(f"DEBUG: Validating phone: '{v}' -> cleaned: '{cleaned}'")
        
        # Check if it's exactly 10 digits
        if not cleaned.isdigit() or len(cleaned) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        
        # Check for at least 3 different digits (prevent patterns like 0000000000, 1111111111)
        unique_digits = len(set(cleaned))
        print(f"DEBUG: Phone unique digits: {unique_digits} for '{cleaned}'")
        if unique_digits < 3:
            raise ValueError("Invalid phone number")
        
        
        return cleaned
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_strength(v)
    
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
    profile_photo: Optional[str] = None
    
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
    
    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Full name cannot be empty")
            
            # Check if name contains only alphabetic characters and spaces
            if not all(char.isalpha() or char.isspace() for char in cleaned):
                raise ValueError("Full name must contain only alphabetic characters and spaces")
            
            if len(cleaned) < 2:
                raise ValueError("Full name must be at least 2 characters long")
            
            return cleaned
        return v
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            # Clean phone number
            cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            
            # Check if it's exactly 10 digits
            if not cleaned.isdigit() or len(cleaned) != 10:
                raise ValueError("Phone number must be exactly 10 digits")
            
            # Check for at least 3 different digits
            unique_digits = len(set(cleaned))
            if unique_digits < 3:
                raise ValueError("Phone number must contain at least 3 different digits")
            
            return cleaned
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, description="New password with minimum 6 characters")
    confirm_password: str = Field(..., min_length=6, description="Confirm password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v, "New password")
    
    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password do not match")
        return self


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="New password with minimum 6 characters")

    @field_validator("new_password")
    @classmethod
    def validate_reset_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v, "New password")
    
    

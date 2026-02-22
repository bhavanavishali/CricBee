
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.core.config import settings  
from app.db.base import Base  
from app.db.session import engine 
from app.models.user import User, UserRole
from app.models.organizer.organization import OrganizationDetails
from app.models.club import Club
from app.models.player import PlayerProfile
from app.models.admin.transaction import AdminWallet
from app.models.organizer.tournament import Tournament


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_admin_user():
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        
        full_name = "Admin User"
        email = "admin@example.com"
        phone = "1234567890"  #
        password = "admin123"  
        role = UserRole.ADMIN  

        
        if db.query(User).filter((User.email == email) | (User.phone == phone)).first():
            print(f"Admin with email {email} or phone {phone} already exists.")
            return

        
        hashed_pw = hash_password(password)
        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            hashed_password=hashed_pw,
            role=role,
            is_superuser=True  
        )

        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Admin user created successfully! ID: {user.id}, Email: {email}")
        print(f"Password (change immediately): {password}")
        print("You can now sign in via /auth/signin.")

    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
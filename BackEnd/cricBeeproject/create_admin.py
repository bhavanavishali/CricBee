import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.core.config import settings  # Adjust import to your config
from app.db.base import Base  # Your Base class
from app.db.session import engine  # Or define engine here if not imported
from app.models.user import User, UserRole
from app.utils.hashing import hash_password  # Your hashing util

# Password hashing context (if not using your util)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_admin_user():
    # Database setup (use your app's engine/session)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Admin details (customize these)
        full_name = "Admin User"
        email = "admin@example.com"
        phone = "1234567890"  # 10 digits
        password = "admin123"  # Change this in production!
        role = UserRole.ADMIN  # Matches your enum

        # Check if already exists
        if db.query(User).filter((User.email == email) | (User.phone == phone)).first():
            print(f"Admin with email {email} or phone {phone} already exists.")
            return

        # Create user
        hashed_pw = hash_password(password)
        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            hashed_password=hashed_pw,
            role=role,
            is_superuser=True  # Explicitly set for admin
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
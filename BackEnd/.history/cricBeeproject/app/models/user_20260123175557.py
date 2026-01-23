from sqlalchemy import Column, Integer, func,String, DateTime,Boolean,Enum as SQLEnum
from app.db.base import Base
import enum
from sqlalchemy.orm import relationship
from datetime import datetime


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    ORGANIZER = "Organizer"
    CLUB_MANAGER = "Club Manager"
    PLAYER = "Player"
    FAN = "Fan"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.FAN)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    profile_photo = Column(String, nullable=True)
    organization = relationship("OrganizationDetails", back_populates="user", uselist=False)
    club = relationship("Club", back_populates="manager", uselist=False)
    player_profile = relationship("PlayerProfile", back_populates="user", uselist=False)
    admin_wallet = relationship("AdminWallet", back_populates="admin", uselist=False)
    

    
    tournaments = relationship("Tournament", back_populates="organizer")
    
    admin_wallet = relationship("AdminWallet", back_populates="admin", uselist=False)

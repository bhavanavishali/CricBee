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
    organization = relationship("OrganizationDetails", back_populates="user", uselist=False)
    club = relationship("Club", back_populates="manager", uselist=False)
    is_verified = Column(Boolean, default=False)
from app.models.club import Club

from app.models.organizer import OrganizationDetails
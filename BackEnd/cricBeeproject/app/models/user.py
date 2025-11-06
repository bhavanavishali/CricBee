from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
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
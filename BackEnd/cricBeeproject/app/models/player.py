# app/models/player.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PlayerProfile(Base):
    __tablename__ = "player_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=False)
    cricb_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    clubs = relationship("ClubPlayer", back_populates="player", cascade="all, delete-orphan")
    club_invitations = relationship("ClubPlayerInvitation", back_populates="player", cascade="all, delete-orphan")
    user = relationship("User", back_populates="player_profile")
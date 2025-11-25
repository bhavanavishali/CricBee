from sqlalchemy import Column, Integer, String, ForeignKey,Boolean, DateTime,func
from sqlalchemy.orm import relationship 
from app.db.base import Base

class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    club_name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    short_name = Column(String, unique=True,nullable=False)
    is_active = Column(Boolean, default=True)
    location = Column(String, nullable=False)
    no_of_players = Column(Integer, default=0)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_image = Column(String, nullable=True) 

    players = relationship("ClubPlayer", back_populates="club", cascade="all, delete-orphan")
    manager = relationship("User", back_populates="club")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())



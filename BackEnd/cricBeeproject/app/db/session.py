from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from dotenv import load_dotenv
import os

load_dotenv() 

# Use environment variable first, then fall back to settings
DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL
if not DATABASE_URL or DATABASE_URL == "sqlite:///./app.db":
    raise ValueError(
        "DATABASE_URL is not properly configured. "
        "Please set DATABASE_URL in your .env file with format: "
        "postgresql://username:password@localhost:5432/database_name"
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
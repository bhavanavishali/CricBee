from fastapi import FastAPI
from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.organizer import router as organizer_router
from app.api.v1.club_manager import router as club_router
from app.api.v1.admin import router as admin_router
from app.api.v1.player import router as player_router

from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
app = FastAPI()


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organizer_router)

app.include_router(club_router)
app.include_router(admin_router)
<<<<<<< HEAD
=======
app.include_router(player_router)
>>>>>>> feature/player



@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"ok": True}
from fastapi import FastAPI
from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine
from app.core.celery_app import celery_app

from app.models.player import PlayerProfile  
from app.models.club import Club  
from app.models.club_player import ClubPlayer  
from app.models.club_player_invitation import ClubPlayerInvitation
from app.models.user import User 
from app.models.organizer import OrganizationDetails
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentEnrollment
from app.models.organizer.fixture import FixtureRound, Match, PlayingXI
from app.models.organizer.match_score import MatchScore, BallByBall, PlayerMatchStats
from app.models.organizer.point_table import PointTable
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.models.admin.transaction import AdminWallet, Transaction
from app.models.chat import ChatMessage
from app.models.notification import Notification

from app.api.v1.auth import router as auth_router
from app.api.v1.organizer import router as organizer_router
from app.api.v1.club_manager import router as club_router
from app.api.v1.clubmanager import router as clubmanager_router
from app.api.v1.admin import router as admin_router
from app.api.v1.player import router as player_router
from app.api.v1.organizer.tournament import router as tournament_router
from app.api.v1.organizer.fixture import router as fixture_router
from app.api.v1.organizer.match_score import router as match_score_router
from app.api.v1.organizer.point_table_final import router as point_table_router
from app.api.v1.organizer.round_completion import router as round_completion_router
from app.api.v1.organizer.round_progression import router as round_progression_router
from app.api.v1.public import router as public_router
from app.api.v1.notifications import router as notification_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.chat import router as chat_router

Base.metadata.create_all(bind=engine)
app = FastAPI()
from dotenv import load_dotenv
import os

load_dotenv()


cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:

    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_router)
app.include_router(organizer_router)
app.include_router(club_router)
app.include_router(clubmanager_router)
app.include_router(admin_router)
app.include_router(player_router)
app.include_router(tournament_router)
app.include_router(fixture_router)
app.include_router(match_score_router)
app.include_router(point_table_router)
app.include_router(round_completion_router)
app.include_router(round_progression_router)
app.include_router(public_router)
app.include_router(chat_router)
app.include_router(notification_router, prefix="/api/v1")


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"ok": True}
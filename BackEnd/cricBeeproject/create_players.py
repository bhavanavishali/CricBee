import os
import sys
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.models.user import User, UserRole
from app.models.player import PlayerProfile
from app.utils.hashing import hash_password


import app.models.user
import app.models.player
import app.models.organizer.organization
import app.models.club
import app.models.club_player
import app.models.club_player_invitation
import app.models.admin.transaction
import app.models.organizer.tournament
import app.models.notification
import app.models.chat
import app.models.organizer.fixture
import app.models.organizer.match_score
from app.models.player import PlayerProfile  
from app.models.club import Club  
from app.models.club_player import ClubPlayer  
from app.models.club_player_invitation import ClubPlayerInvitation
from app.models.organizer.organization import OrganizationDetails
from app.models.user import User, UserRole
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.models.organizer.fixture_mode import FixtureMode
from app.models.notification import Notification
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentEnrollment
from app.models.organizer.match_score import MatchScore, BallByBall, PlayerMatchStats
from app.models.organizer.fixture import FixtureRound, Match, PlayingXI
from app.models.organizer.point_table import PointTable
from app.models.admin.transaction import AdminWallet, Transaction
from app.models.chat import ChatMessage


def create_test_players():
    
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Generate players dynamically
    players_data = []

    for i in range(1, 13):
        players_data.append({
            "full_name": f"Player {i}",
            "email": f"player{i}@email.com",
            "phone": f"+123456789{str(i).zfill(2)}",
            "password": "player123",
            "age": 20 + i,
            "address": f"{i} Cricket Street, Sports City",
            "cricb_id": f"CRICB{str(i).zfill(3)}"
        })

    try:
        created_players = []

        for player_data in players_data:

            
            existing_user = db.query(User).filter(
                (User.email == player_data["email"]) |
                (User.phone == player_data["phone"])
            ).first()

            if existing_user:
                print(f"User {player_data['email']} already exists, skipping...")
                continue

            
            hashed_pw = hash_password(player_data["password"])

            user = User(
                full_name=player_data["full_name"],
                email=player_data["email"],
                phone=player_data["phone"],
                hashed_password=hashed_pw,
                role=UserRole.PLAYER,
                is_active=True,
                is_verified=True
            )

            db.add(user)
            db.commit()
            db.refresh(user)

          
            player_profile = PlayerProfile(
                user_id=user.id,
                age=player_data["age"],
                address=player_data["address"],
                cricb_id=player_data["cricb_id"]
            )

            db.add(player_profile)
            db.commit()
            db.refresh(player_profile)

            created_players.append({
                "name": player_data["full_name"],
                "email": player_data["email"],
                "password": player_data["password"],
                "cricb_id": player_data["cricb_id"]
            })

        

        for player in created_players:
            print(f"Name     : {player['name']}")
            

        print("\nYou can now sign in using email/phone and password 'player123'")

    except Exception as e:
        print(f"Error creating players: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_players()
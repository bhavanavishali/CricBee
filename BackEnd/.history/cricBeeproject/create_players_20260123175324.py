import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
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

# Now import the specific classes we need
from app.models.user import User, UserRole
from app.models.player import PlayerProfile

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_test_players():
    """Create 12 test players with profiles"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Player data
    players_data = [
        {
            "full_name": "John Smith",
            "email": "john.smith@email.com",
            "phone": "+12345678901",
            "password": "player123",
            "age": 25,
            "address": "123 Main Street, New York, NY 10001",
            "cricb_id": "CRICB001"
        },
        {
            "full_name": "Michael Johnson",
            "email": "michael.j@email.com",
            "phone": "+12345678902",
            "password": "player123",
            "age": 28,
            "address": "456 Oak Avenue, Los Angeles, CA 90001",
            "cricb_id": "CRICB002"
        },
        {
            "full_name": "David Williams",
            "email": "david.w@email.com",
            "phone": "+12345678903",
            "password": "player123",
            "age": 22,
            "address": "789 Elm Road, Chicago, IL 60601",
            "cricb_id": "CRICB003"
        },
        {
            "full_name": "James Brown",
            "email": "james.brown@email.com",
            "phone": "+12345678904",
            "password": "player123",
            "age": 30,
            "address": "321 Pine Street, Houston, TX 77001",
            "cricb_id": "CRICB004"
        },
        {
            "full_name": "Robert Davis",
            "email": "robert.davis@email.com",
            "phone": "+12345678905",
            "password": "player123",
            "age": 27,
            "address": "654 Maple Drive, Phoenix, AZ 85001",
            "cricb_id": "CRICB005"
        },
        {
            "full_name": "Christopher Miller",
            "email": "chris.miller@email.com",
            "phone": "+12345678906",
            "password": "player123",
            "age": 24,
            "address": "987 Cedar Lane, Philadelphia, PA 19101",
            "cricb_id": "CRICB006"
        },
        {
            "full_name": "Daniel Wilson",
            "email": "daniel.wilson@email.com",
            "phone": "+12345678907",
            "password": "player123",
            "age": 29,
            "address": "147 Birch Boulevard, San Antonio, TX 78201",
            "cricb_id": "CRICB007"
        },
        {
            "full_name": "Matthew Moore",
            "email": "matthew.moore@email.com",
            "phone": "+12345678908",
            "password": "player123",
            "age": 26,
            "address": "258 Walnut Street, San Diego, CA 92101",
            "cricb_id": "CRICB008"
        },
        {
            "full_name": "Anthony Taylor",
            "email": "anthony.taylor@email.com",
            "phone": "+12345678909",
            "password": "player123",
            "age": 31,
            "address": "369 Spruce Way, Dallas, TX 75201",
            "cricb_id": "CRICB009"
        },
        {
            "full_name": "Mark Anderson",
            "email": "mark.anderson@email.com",
            "phone": "+12345678910",
            "password": "player123",
            "age": 23,
            "address": "741 Ash Avenue, San Jose, CA 95101",
            "cricb_id": "CRICB010"
        },
        {
            "full_name": "Steven Thomas",
            "email": "steven.thomas@email.com",
            "phone": "+12345678911",
            "password": "player123",
            "age": 32,
            "address": "852 Poplar Road, Austin, TX 78701",
            "cricb_id": "CRICB011"
        },
        {
            "full_name": "Paul Jackson",
            "email": "paul.jackson@email.com",
            "phone": "+12345678912",
            "password": "player123",
            "age": 25,
            "address": "963 Cherry Street, Jacksonville, FL 32201",
            "cricb_id": "CRICB012"
        }
    ]

    try:
        created_players = []
        
        for player_data in players_data:
            # Check if user already exists
            existing_user = db.query(User).filter(
                (User.email == player_data["email"]) | 
                (User.phone == player_data["phone"])
            ).first()
            
            if existing_user:
                print(f"User {player_data['email']} already exists, skipping...")
                continue
            
            # Create user
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
            
            # Create player profile
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
                "id": user.id,
                "name": player_data["full_name"],
                "email": player_data["email"],
                "password": player_data["password"],
                "cricb_id": player_data["cricb_id"]
            })
        
        print(f"\n✅ Successfully created {len(created_players)} players!")
        print("\nPlayer Login Credentials:")
        print("-" * 50)
        for player in created_players:
            print(f"Name: {player['name']}")
            print(f"Email: {player['email']}")
            print(f"Password: {player['password']}")
            print(f"CricB ID: {player['cricb_id']}")
            print("-" * 50)
        
        print(f"\nYou can now sign in with any of these accounts using email/phone and password 'player123'")
        
    except Exception as e:
        print(f"❌ Error creating players: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_test_players()
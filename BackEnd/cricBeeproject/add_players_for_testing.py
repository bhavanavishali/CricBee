"""
Script to add players to clubs for testing scoreboard functionality.
This script directly adds players to clubs without going through the invitation process.
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.club import Club
from app.models.player import PlayerProfile
from app.models.club_player import ClubPlayer
from app.models.user import User

def add_players_to_club(club_id: int, num_players: int = 11):
    """Add players to a club for testing"""
    db: Session = SessionLocal()
    
    try:
        # Get the club
        club = db.query(Club).filter(Club.id == club_id).first()
        if not club:
            print(f"Error: Club with ID {club_id} not found")
            return False
        
        print(f"Adding players to club: {club.club_name} (ID: {club_id})")
        
        # Get all available player profiles
        from app.models.user import UserRole
        all_players = db.query(PlayerProfile).join(User).filter(
            User.role == UserRole.PLAYER
        ).all()
        
        if len(all_players) < num_players:
            print(f"Warning: Only {len(all_players)} players found, but {num_players} requested")
            num_players = len(all_players)
        
        # Get players already in the club
        existing_players = db.query(ClubPlayer.player_id).filter(
            ClubPlayer.club_id == club_id
        ).all()
        existing_player_ids = {p.player_id for p in existing_players}
        
        # Filter out players already in the club
        available_players = [p for p in all_players if p.id not in existing_player_ids]
        
        if len(available_players) < num_players:
            print(f"Warning: Only {len(available_players)} new players available, but {num_players} requested")
            num_players = len(available_players)
        
        # Add players to club
        added_count = 0
        for i, player in enumerate(available_players[:num_players]):
            # Check if already in club (double check)
            existing = db.query(ClubPlayer).filter(
                ClubPlayer.club_id == club_id,
                ClubPlayer.player_id == player.id
            ).first()
            
            if existing:
                print(f"  - Player {player.user.full_name} (ID: {player.id}) already in club, skipping")
                continue
            
            # Create club player association
            club_player = ClubPlayer(
                club_id=club_id,
                player_id=player.id
            )
            db.add(club_player)
            added_count += 1
            print(f"  + Added player {i+1}/{num_players}: {player.user.full_name} (CricB ID: {player.cricb_id})")
        
        # Update club player count
        total_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).count()
        club.no_of_players = total_players
        
        db.commit()
        print(f"\nSuccessfully added {added_count} players to club '{club.club_name}'")
        print(f"Total players in club now: {total_players}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def list_clubs():
    """List all available clubs"""
    db: Session = SessionLocal()
    
    try:
        clubs = db.query(Club).all()
        if not clubs:
            print("No clubs found")
            return
        
        print("\nAvailable clubs:")
        print("-" * 80)
        print(f"{'ID':<5} {'Club Name':<30} {'Manager':<25} {'Players':<10}")
        print("-" * 80)
        for club in clubs:
            player_count = db.query(ClubPlayer).filter(ClubPlayer.club_id == club.id).count()
            manager_name = club.manager.full_name if club.manager else "N/A"
            print(f"{club.id:<5} {club.club_name:<30} {manager_name:<25} {player_count:<10}")
        print("-" * 80)
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

def list_players_in_club(club_id: int):
    """List all players in a club"""
    db: Session = SessionLocal()
    
    try:
        club = db.query(Club).filter(Club.id == club_id).first()
        if not club:
            print(f"Error: Club with ID {club_id} not found")
            return
        
        club_players = db.query(ClubPlayer).filter(ClubPlayer.club_id == club_id).all()
        
        print(f"\nPlayers in club: {club.club_name} (ID: {club_id})")
        print("-" * 80)
        print(f"{'ID':<5} {'Name':<30} {'CricB ID':<15} {'Email':<30}")
        print("-" * 80)
        
        for cp in club_players:
            player = db.query(PlayerProfile).filter(PlayerProfile.id == cp.player_id).first()
            if player and player.user:
                print(f"{player.id:<5} {player.user.full_name:<30} {player.cricb_id or 'N/A':<15} {player.user.email:<30}")
        
        print("-" * 80)
        print(f"Total: {len(club_players)} players")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 80)
    print("CricBee - Add Players to Club for Testing")
    print("=" * 80)
    
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python add_players_for_testing.py list                              # List all clubs")
        print("  python add_players_for_testing.py add <club_id> [num_players]        # Add players to club (default: 11)")
        print("  python add_players_for_testing.py players <club_id>                  # List players in club")
        print("\nExample:")
        print("  python add_players_for_testing.py list")
        print("  python add_players_for_testing.py add 1 11  # Add 11 players to club ID 1")
        print("  python add_players_for_testing.py players 1  # List players in club ID 1")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "list":
        list_clubs()
    
    elif command == "add":
        if len(sys.argv) < 3:
            print("Error: Please provide club_id")
            sys.exit(1)
        
        try:
            club_id = int(sys.argv[2])
            num_players = int(sys.argv[3]) if len(sys.argv) > 3 else 11
            add_players_to_club(club_id, num_players)
        except ValueError:
            print("Error: club_id and num_players must be integers")
            sys.exit(1)
    
    elif command == "players":
        if len(sys.argv) < 3:
            print("Error: Please provide club_id")
            sys.exit(1)
        
        try:
            club_id = int(sys.argv[2])
            list_players_in_club(club_id)
        except ValueError:
            print("Error: club_id must be an integer")
            sys.exit(1)
    
    else:
        print(f"Error: Unknown command '{command}'")
        sys.exit(1)


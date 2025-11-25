"""
Script to apply the club_players table migration.
Run this script to apply the migration if alembic upgrade head doesn't work.
"""
import subprocess
import sys
import os

def apply_migration():
    """Apply the Alembic migration."""
    # Change to the project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        print("Applying Alembic migrations...")
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        print("Migration applied successfully!")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print("Error applying migration:")
        print(e.stderr)
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    apply_migration()


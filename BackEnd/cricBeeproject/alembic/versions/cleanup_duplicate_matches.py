"""cleanup duplicate matches

Revision ID: cleanup_duplicate_matches
Revises: make_fixture_rounds_global
Create Date: 2026-01-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cleanup_duplicate_matches'
down_revision: Union[str, Sequence[str], None] = 'make_fixture_rounds_global'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove duplicate matches based on tournament_id, round_id, and match_number
    # Keep the match with the lowest ID, delete the rest
    op.execute("""
        DELETE FROM matches
        WHERE id IN (
            SELECT id
            FROM (
                SELECT 
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY tournament_id, round_id, match_number 
                        ORDER BY id ASC
                    ) as row_num
                FROM matches
            ) AS duplicates
            WHERE row_num > 1
        );
    """)
    
    # Also remove duplicate team combinations in the same round/tournament
    # Keep the match with the lowest ID, delete the rest
    op.execute("""
        DELETE FROM matches
        WHERE id IN (
            SELECT id
            FROM (
                SELECT 
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY 
                            tournament_id, 
                            round_id,
                            LEAST(team_a_id, team_b_id),
                            GREATEST(team_a_id, team_b_id)
                        ORDER BY id ASC
                    ) as row_num
                FROM matches
            ) AS duplicates
            WHERE row_num > 1
        );
    """)


def downgrade() -> None:
    # Cannot restore deleted duplicates
    pass


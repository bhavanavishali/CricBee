"""add winning_status to match_scores

Revision ID: add_winning_status
Revises: add_inning_no_and_winner_id
Create Date: 2026-01-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_winning_status'
down_revision: Union[str, Sequence[str], None] = 'add_inning_no_and_winner_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add winning_status column to match_scores table
    op.add_column('match_scores', 
        sa.Column('winning_status', sa.String(length=10), nullable=True)
    )
    
    # Add a comment to the column
    op.execute("""
        COMMENT ON COLUMN match_scores.winning_status IS 'Win or Loss status after match completion';
    """)


def downgrade() -> None:
    # Remove winning_status column
    op.drop_column('match_scores', 'winning_status')


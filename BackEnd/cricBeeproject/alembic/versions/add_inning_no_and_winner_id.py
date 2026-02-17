"""add inning_no and winner_id

Revision ID: add_inning_no_and_winner_id
Revises: cleanup_duplicate_matches
Create Date: 2026-01-26 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_inning_no_and_winner_id'
down_revision: Union[str, Sequence[str], None] = 'cleanup_duplicate_matches'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add inning_no column to match_scores table
    op.add_column('match_scores', sa.Column('inning_no', sa.Integer(), nullable=True))
    
    # Set default inning_no for existing records
    # Inning 1 = batting team, Inning 2 = bowling team
    op.execute("""
        UPDATE match_scores ms
        SET inning_no = CASE 
            WHEN ms.team_id = m.batting_team_id THEN 1
            WHEN ms.team_id = m.bowling_team_id THEN 2
            ELSE 1
        END
        FROM matches m
        WHERE ms.match_id = m.id
        AND ms.inning_no IS NULL;
    """)
    
    # Make inning_no NOT NULL after setting defaults
    op.alter_column('match_scores', 'inning_no', nullable=False)
    
    # Update unique constraint to include inning_no
    op.drop_constraint('uq_match_team_score', 'match_scores', type_='unique')
    op.create_unique_constraint('uq_match_team_inning_score', 'match_scores', ['match_id', 'team_id', 'inning_no'])
    
    # Add winner_id column to matches table
    op.add_column('matches', sa.Column('winner_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_matches_winner_id',
        'matches',
        'clubs',
        ['winner_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_matches_winner_id', 'matches', ['winner_id'])


def downgrade() -> None:
    # Remove winner_id from matches
    op.drop_index('ix_matches_winner_id', table_name='matches')
    op.drop_constraint('fk_matches_winner_id', 'matches', type_='foreignkey')
    op.drop_column('matches', 'winner_id')
    
    # Remove inning_no from match_scores
    op.drop_constraint('uq_match_team_inning_score', 'match_scores', type_='unique')
    op.create_unique_constraint('uq_match_team_score', 'match_scores', ['match_id', 'team_id'])
    op.drop_column('match_scores', 'inning_no')


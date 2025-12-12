"""add is_striker field to player_match_stats

Revision ID: add_is_striker_field
Revises: add_toss_and_scoreboard_tables
Create Date: 2025-01-21 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_is_striker_field'
down_revision: Union[str, None] = 'add_toss_and_scoreboard_tables'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Add is_striker field to player_match_stats table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'player_match_stats' in tables:
        columns = [col['name'] for col in inspector.get_columns('player_match_stats')]
        
        if 'is_striker' not in columns:
            op.add_column('player_match_stats', 
                         sa.Column('is_striker', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Remove is_striker field from player_match_stats table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'player_match_stats' in tables:
        columns = [col['name'] for col in inspector.get_columns('player_match_stats')]
        
        if 'is_striker' in columns:
            op.drop_column('player_match_stats', 'is_striker')


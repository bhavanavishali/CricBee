"""add is_published to matches

Revision ID: add_is_published_to_matches
Revises: add_fixture_tables
Create Date: 2025-01-20 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_is_published_to_matches'
down_revision: Union[str, None] = 'add_fixture_tables'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Add is_published column to matches table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if matches table exists
    if 'matches' in inspector.get_table_names():
        # Check if column already exists
        columns = [col['name'] for col in inspector.get_columns('matches')]
        if 'is_published' not in columns:
            op.add_column('matches', sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Remove is_published column from matches table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if matches table exists
    if 'matches' in inspector.get_table_names():
        # Check if column exists
        columns = [col['name'] for col in inspector.get_columns('matches')]
        if 'is_published' in columns:
            op.drop_column('matches', 'is_published')


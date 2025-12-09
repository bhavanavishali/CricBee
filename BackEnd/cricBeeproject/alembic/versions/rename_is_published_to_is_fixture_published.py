"""rename is_published to is_fixture_published

Revision ID: rename_is_published_to_is_fixture_published
Revises: add_is_published_to_matches
Create Date: 2025-01-28 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'rename_is_published_to_is_fixture_published'
down_revision: Union[str, None] = 'add_is_published_to_matches'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Rename is_published column to is_fixture_published in matches table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if matches table exists
    if 'matches' in inspector.get_table_names():
        # Check if column exists
        columns = [col['name'] for col in inspector.get_columns('matches')]
        if 'is_published' in columns and 'is_fixture_published' not in columns:
            op.alter_column('matches', 'is_published', new_column_name='is_fixture_published')


def downgrade() -> None:
    """Rename is_fixture_published column back to is_published in matches table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if matches table exists
    if 'matches' in inspector.get_table_names():
        # Check if column exists
        columns = [col['name'] for col in inspector.get_columns('matches')]
        if 'is_fixture_published' in columns and 'is_published' not in columns:
            op.alter_column('matches', 'is_fixture_published', new_column_name='is_published')


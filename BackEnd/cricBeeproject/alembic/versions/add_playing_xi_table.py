"""add playing_xi table

Revision ID: add_playing_xi_table
Revises: rename_is_published_to_is_fixture_published
Create Date: 2025-01-28 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_playing_xi_table'
down_revision: Union[str, None] = 'rename_is_published_to_is_fixture_published'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Create playing_xi table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create playing_xi table
    if 'playing_xi' not in tables:
        op.create_table(
            'playing_xi',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('match_id', sa.Integer(), nullable=False),
            sa.Column('club_id', sa.Integer(), nullable=False),
            sa.Column('player_id', sa.Integer(), nullable=False),
            sa.Column('is_captain', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_vice_captain', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['player_id'], ['player_profiles.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_playing_xi_id'), 'playing_xi', ['id'], unique=False)
        op.create_index(op.f('ix_playing_xi_match_id'), 'playing_xi', ['match_id'], unique=False)
        op.create_index(op.f('ix_playing_xi_club_id'), 'playing_xi', ['club_id'], unique=False)
        op.create_index(op.f('ix_playing_xi_player_id'), 'playing_xi', ['player_id'], unique=False)


def downgrade() -> None:
    """Drop playing_xi table"""
    op.drop_index(op.f('ix_playing_xi_player_id'), table_name='playing_xi')
    op.drop_index(op.f('ix_playing_xi_club_id'), table_name='playing_xi')
    op.drop_index(op.f('ix_playing_xi_match_id'), table_name='playing_xi')
    op.drop_index(op.f('ix_playing_xi_id'), table_name='playing_xi')
    op.drop_table('playing_xi')


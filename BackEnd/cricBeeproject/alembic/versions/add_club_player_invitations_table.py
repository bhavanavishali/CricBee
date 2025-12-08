"""add club player invitations table

Revision ID: add_club_player_invitations
Revises: add_fixture_tables
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_club_player_invitations'
down_revision: Union[str, None] = 'add_fixture_tables'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Create club_player_invitations table"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create club_player_invitations table
    if 'club_player_invitations' not in tables:
        op.create_table(
            'club_player_invitations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('club_id', sa.Integer(), nullable=False),
            sa.Column('player_id', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(), nullable=False, server_default='pending'),
            sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['player_id'], ['player_profiles.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('club_id', 'player_id', name='uq_club_player_invitation')
        )
        op.create_index(op.f('ix_club_player_invitations_club_id'), 'club_player_invitations', ['club_id'], unique=False)
        op.create_index(op.f('ix_club_player_invitations_player_id'), 'club_player_invitations', ['player_id'], unique=False)


def downgrade() -> None:
    """Drop club_player_invitations table"""
    op.drop_index(op.f('ix_club_player_invitations_player_id'), table_name='club_player_invitations')
    op.drop_index(op.f('ix_club_player_invitations_club_id'), table_name='club_player_invitations')
    op.drop_table('club_player_invitations')


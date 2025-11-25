"""add_club_players_table

Revision ID: a1b2c3d4e5f6
Revises: ab0d22e79f34
Create Date: 2024-11-22 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd688b0ad12dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'club_players',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['player_id'], ['player_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('club_id', 'player_id', name='uq_club_player')
    )
    op.create_index(op.f('ix_club_players_club_id'), 'club_players', ['club_id'], unique=False)
    op.create_index(op.f('ix_club_players_player_id'), 'club_players', ['player_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_club_players_player_id'), table_name='club_players')
    op.drop_index(op.f('ix_club_players_club_id'), table_name='club_players')
    op.drop_table('club_players')


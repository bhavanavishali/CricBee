"""paln pricing table

Revision ID: 6ae00ee96001
Revises: add_profile_photo_users
Create Date: 2025-11-27 19:05:25.316008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ae00ee96001'
down_revision: Union[str, Sequence[str], None] = 'add_profile_photo_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create tournament_pricing_plans table
    op.create_table(
        'tournament_pricing_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_name', sa.String(), nullable=False),
        sa.Column('plan_range', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='inactive'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tournament_pricing_plans_id'), 'tournament_pricing_plans', ['id'], unique=False)
    
    # Club players table modifications
    op.drop_constraint(op.f('uq_club_player'), 'club_players', type_='unique')
    op.create_index(op.f('ix_club_players_id'), 'club_players', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tournament_pricing_plans table
    op.drop_index(op.f('ix_tournament_pricing_plans_id'), table_name='tournament_pricing_plans')
    op.drop_table('tournament_pricing_plans')
    
    # Club players table modifications
    op.drop_index(op.f('ix_club_players_id'), table_name='club_players')
    op.create_unique_constraint(op.f('uq_club_player'), 'club_players', ['club_id', 'player_id'], postgresql_nulls_not_distinct=False)

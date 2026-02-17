"""drop and recreate fixture_rounds table

Revision ID: drop_and_recreate_fixture_rounds
Revises: add_fixture_mode_and_round_no
Create Date: 2025-01-25 15:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'drop_and_recreate_fixture_rounds'
down_revision: Union[str, Sequence[str], None] = 'add_fixture_mode_and_round_no'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing fixture_rounds table (CASCADE will delete related matches)
    op.execute('DROP TABLE IF EXISTS fixture_rounds CASCADE')
    
    # Recreate fixture_rounds table with new structure
    op.create_table(
        'fixture_rounds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('round_no', sa.Integer(), nullable=False),
        sa.Column('round_name', sa.String(), nullable=False),
        sa.Column('number_of_matches', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fixture_rounds_id'), 'fixture_rounds', ['id'], unique=False)
    op.create_index(op.f('ix_fixture_rounds_tournament_id'), 'fixture_rounds', ['tournament_id'], unique=False)


def downgrade() -> None:
    # Drop the new fixture_rounds table
    op.drop_index(op.f('ix_fixture_rounds_tournament_id'), table_name='fixture_rounds')
    op.drop_index(op.f('ix_fixture_rounds_id'), table_name='fixture_rounds')
    op.drop_table('fixture_rounds')
    
    # Recreate old fixture_rounds table structure (without round_no)
    op.create_table(
        'fixture_rounds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('round_name', sa.String(), nullable=False),
        sa.Column('number_of_matches', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fixture_rounds_id'), 'fixture_rounds', ['id'], unique=False)
    op.create_index(op.f('ix_fixture_rounds_tournament_id'), 'fixture_rounds', ['tournament_id'], unique=False)

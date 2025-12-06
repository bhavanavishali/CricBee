"""add fixture rounds and matches tables

Revision ID: add_fixture_tables
Revises: add_enrollment_fee_and_enrollments
Create Date: 2025-12-06 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_fixture_tables'
down_revision: Union[str, None] = 'add_enrollment_fee_and_enrollments'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Create fixture_rounds and matches tables"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create fixture_rounds table
    if 'fixture_rounds' not in tables:
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
    
    # Create matches table
    if 'matches' not in tables:
        op.create_table(
            'matches',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('round_id', sa.Integer(), nullable=False),
            sa.Column('tournament_id', sa.Integer(), nullable=False),
            sa.Column('match_number', sa.String(), nullable=False),
            sa.Column('team_a_id', sa.Integer(), nullable=False),
            sa.Column('team_b_id', sa.Integer(), nullable=False),
            sa.Column('match_date', sa.Date(), nullable=False),
            sa.Column('match_time', sa.Time(), nullable=False),
            sa.Column('venue', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['round_id'], ['fixture_rounds.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['team_a_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['team_b_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_matches_id'), 'matches', ['id'], unique=False)
        op.create_index(op.f('ix_matches_round_id'), 'matches', ['round_id'], unique=False)
        op.create_index(op.f('ix_matches_tournament_id'), 'matches', ['tournament_id'], unique=False)


def downgrade() -> None:
    """Drop fixture_rounds and matches tables"""
    op.drop_index(op.f('ix_matches_tournament_id'), table_name='matches')
    op.drop_index(op.f('ix_matches_round_id'), table_name='matches')
    op.drop_index(op.f('ix_matches_id'), table_name='matches')
    op.drop_table('matches')
    op.drop_index(op.f('ix_fixture_rounds_tournament_id'), table_name='fixture_rounds')
    op.drop_index(op.f('ix_fixture_rounds_id'), table_name='fixture_rounds')
    op.drop_table('fixture_rounds')


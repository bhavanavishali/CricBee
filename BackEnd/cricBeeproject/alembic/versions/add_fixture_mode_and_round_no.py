"""add fixture mode and round_no

Revision ID: add_fixture_mode_and_round_no
Revises: 846a0a47372d
Create Date: 2025-01-25 13:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_fixture_mode_and_round_no'
down_revision: Union[str, Sequence[str], None] = '846a0a47372d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    from sqlalchemy.engine import reflection
    
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Create fixture_modes table if it doesn't exist
    if 'fixture_modes' not in inspector.get_table_names():
        op.create_table(
            'fixture_modes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('mode_name', sa.String(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('mode_name')
        )
        op.create_index(op.f('ix_fixture_modes_id'), 'fixture_modes', ['id'], unique=False)
        
        # Insert default fixture modes
        op.execute(
            """
            INSERT INTO fixture_modes (id, mode_name) VALUES
            (1, 'Manual Fixture'),
            (2, 'League Fixture')
            ON CONFLICT (id) DO NOTHING;
            """
        )
    else:
        # Table exists, ensure data is present
        op.execute(
            """
            INSERT INTO fixture_modes (id, mode_name) VALUES
            (1, 'Manual Fixture'),
            (2, 'League Fixture')
            ON CONFLICT (id) DO NOTHING;
            """
        )
    
    # Add fixture_mode_id to tournaments table if it doesn't exist
    tournaments_columns = [col['name'] for col in inspector.get_columns('tournaments')]
    if 'fixture_mode_id' not in tournaments_columns:
        op.add_column('tournaments', sa.Column('fixture_mode_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_tournaments_fixture_mode_id', 'tournaments', 'fixture_modes', ['fixture_mode_id'], ['id'])
    
    # Add round_no to fixture_rounds table if it doesn't exist
    fixture_rounds_columns = [col['name'] for col in inspector.get_columns('fixture_rounds')]
    if 'round_no' not in fixture_rounds_columns:
        op.add_column('fixture_rounds', sa.Column('round_no', sa.Integer(), nullable=True))
        
        # Update existing fixture_rounds with sequential round_no based on created_at
        op.execute(
            """
            WITH ranked_rounds AS (
                SELECT id, 
                       ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY created_at) as rn
                FROM fixture_rounds
            )
            UPDATE fixture_rounds
            SET round_no = ranked_rounds.rn
            FROM ranked_rounds
            WHERE fixture_rounds.id = ranked_rounds.id;
            """
        )
        
        # Make round_no non-nullable after populating existing data
        op.alter_column('fixture_rounds', 'round_no', nullable=False)


def downgrade() -> None:
    # Remove round_no from fixture_rounds
    op.drop_column('fixture_rounds', 'round_no')
    
    # Remove fixture_mode_id from tournaments
    op.drop_constraint('fk_tournaments_fixture_mode_id', 'tournaments', type_='foreignkey')
    op.drop_column('tournaments', 'fixture_mode_id')
    
    # Drop fixture_modes table
    op.drop_index(op.f('ix_fixture_modes_id'), table_name='fixture_modes')
    op.drop_table('fixture_modes')

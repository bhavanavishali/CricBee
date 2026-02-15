"""make fixture_rounds global

Revision ID: make_fixture_rounds_global
Revises: drop_and_recreate_fixture_rounds
Create Date: 2026-01-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'make_fixture_rounds_global'
down_revision: Union[str, Sequence[str], None] = 'drop_and_recreate_fixture_rounds'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Check if fixture_rounds table exists
    if 'fixture_rounds' not in inspector.get_table_names():
        # Create new fixture_rounds table without tournament_id
        op.create_table(
            'fixture_rounds',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('round_no', sa.Integer(), nullable=False),
            sa.Column('round_name', sa.String(), nullable=False),
            sa.Column('number_of_matches', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('round_no')
        )
        op.create_index(op.f('ix_fixture_rounds_id'), 'fixture_rounds', ['id'], unique=False)
        
        # Insert 3 default rounds
        op.execute("""
            INSERT INTO fixture_rounds (id, round_no, round_name, number_of_matches) VALUES
            (1, 1, 'Round 1', 0),
            (2, 2, 'Round 2', 0),
            (3, 3, 'Round 3', 0)
            ON CONFLICT (round_no) DO NOTHING;
        """)
    else:
        # Table exists, need to migrate existing data
        
        # Step 1: Save round_no mapping for matches before we delete rounds
        # Add temporary column to store round_no
        op.execute("""
            ALTER TABLE matches ADD COLUMN IF NOT EXISTS temp_round_no INTEGER;
        """)
        
        op.execute("""
            UPDATE matches 
            SET temp_round_no = (
                SELECT round_no 
                FROM fixture_rounds 
                WHERE fixture_rounds.id = matches.round_id
            )
            WHERE EXISTS (
                SELECT 1 FROM fixture_rounds WHERE fixture_rounds.id = matches.round_id
            );
        """)
        
        # Step 2: Drop foreign key constraint on matches.round_id
        op.execute("""
            ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_round_id_fkey;
        """)
        
        # Step 3: Drop tournament_id constraint and column from fixture_rounds
        op.execute("""
            ALTER TABLE fixture_rounds DROP CONSTRAINT IF EXISTS fixture_rounds_tournament_id_fkey;
        """)
        
        op.execute("""
            ALTER TABLE fixture_rounds DROP COLUMN IF EXISTS tournament_id;
        """)
        
        # Step 4: Delete all existing rounds (we'll recreate them as global)
        op.execute("""
            DELETE FROM fixture_rounds;
        """)
        
        # Step 5: Create the 3 global rounds
        op.execute("""
            INSERT INTO fixture_rounds (id, round_no, round_name, number_of_matches) VALUES
            (1, 1, 'Round 1', 0),
            (2, 2, 'Round 2', 0),
            (3, 3, 'Round 3', 0);
        """)
        
        # Step 6: Add unique constraint on round_no (now safe since we only have 3 unique rows)
        op.execute("""
            ALTER TABLE fixture_rounds ADD CONSTRAINT uq_fixture_rounds_round_no UNIQUE (round_no);
        """)
        
        # Step 7: Update matches to use the new global round_id based on round_no
        # Only update matches where temp_round_no is 1, 2, or 3
        op.execute("""
            UPDATE matches 
            SET round_id = (
                SELECT id 
                FROM fixture_rounds 
                WHERE fixture_rounds.round_no = matches.temp_round_no
            )
            WHERE temp_round_no IN (1, 2, 3);
        """)
        
        # Step 8: Handle matches with invalid round_no values
        # Set their round_id to NULL (or Round 1 as fallback)
        # First, let's set invalid round_ids to Round 1 as a fallback
        op.execute("""
            UPDATE matches 
            SET round_id = (
                SELECT id 
                FROM fixture_rounds 
                WHERE fixture_rounds.round_no = 1
            )
            WHERE temp_round_no IS NOT NULL 
            AND temp_round_no NOT IN (1, 2, 3);
        """)
        
        # Step 9: Handle matches with NULL temp_round_no or invalid round_id
        # Set them to Round 1 as fallback
        op.execute("""
            UPDATE matches 
            SET round_id = (
                SELECT id 
                FROM fixture_rounds 
                WHERE fixture_rounds.round_no = 1
            )
            WHERE (temp_round_no IS NULL OR round_id NOT IN (SELECT id FROM fixture_rounds))
            AND round_id IS NOT NULL;
        """)
        
        # Step 10: Ensure all matches have valid round_ids (set NULL to Round 1)
        op.execute("""
            UPDATE matches 
            SET round_id = (
                SELECT id 
                FROM fixture_rounds 
                WHERE fixture_rounds.round_no = 1
            )
            WHERE round_id IS NULL;
        """)
        
        # Step 11: Final cleanup - delete any matches that still have invalid round_ids
        # This should not happen, but it's a safety check
        op.execute("""
            DELETE FROM matches 
            WHERE round_id IS NULL 
            OR round_id NOT IN (SELECT id FROM fixture_rounds);
        """)
        
        # Step 12: Drop temp column
        op.execute("""
            ALTER TABLE matches DROP COLUMN IF EXISTS temp_round_no;
        """)
        
        # Step 13: Recreate foreign key constraint
        op.execute("""
            ALTER TABLE matches 
            ADD CONSTRAINT matches_round_id_fkey 
            FOREIGN KEY (round_id) REFERENCES fixture_rounds(id) ON DELETE CASCADE;
        """)
        
        # Step 14: Drop old index on tournament_id if it exists
        op.execute("""
            DROP INDEX IF EXISTS ix_fixture_rounds_tournament_id;
        """)


def downgrade() -> None:
    # Add tournament_id back to fixture_rounds
    op.add_column('fixture_rounds', sa.Column('tournament_id', sa.Integer(), nullable=True))
    
    # Create foreign key
    op.create_foreign_key(
        'fixture_rounds_tournament_id_fkey',
        'fixture_rounds',
        'tournaments',
        ['tournament_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # Create index
    op.create_index('ix_fixture_rounds_tournament_id', 'fixture_rounds', ['tournament_id'])
    
    # Remove unique constraint on round_no
    op.drop_constraint('uq_fixture_rounds_round_no', 'fixture_rounds', type_='unique')
    
    # Note: We can't fully restore the old data structure as we don't know which tournament each round belonged to
    # This is a one-way migration in practice


"""add enrollment fee and tournament enrollments

Revision ID: add_enrollment_fee_enrollments
Revises: c06652b74667
Create Date: 2025-01-XX 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'add_enrollment_fee_enrollments'
down_revision: Union[str, Sequence[str], None] = 'c06652b74667'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add enrollment fee, club_manager_id, and tournament_enrollments table"""
    
    # Check if columns exist before adding them
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Add enrollment_fee to tournament_details if it doesn't exist
    tournament_details_columns = [col['name'] for col in inspector.get_columns('tournament_details')]
    if 'enrollment_fee' not in tournament_details_columns:
        op.add_column('tournament_details', 
                      sa.Column('enrollment_fee', sa.Numeric(10, 2), nullable=False, server_default='0.00'))
    
    # Add club_manager_id to transactions if it doesn't exist
    transactions_columns = [col['name'] for col in inspector.get_columns('transactions')]
    if 'club_manager_id' not in transactions_columns:
        op.add_column('transactions', sa.Column('club_manager_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_transactions_club_manager_id', 'transactions', 'users', ['club_manager_id'], ['id'])
    
    # Create tournament_enrollments table if it doesn't exist
    tables = inspector.get_table_names()
    if 'tournament_enrollments' not in tables:
        op.create_table(
            'tournament_enrollments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('tournament_id', sa.Integer(), nullable=False),
            sa.Column('club_id', sa.Integer(), nullable=False),
            sa.Column('enrolled_by', sa.Integer(), nullable=False),
            sa.Column('enrolled_fee', sa.Numeric(10, 2), nullable=False),
            sa.Column('payment_status', sa.String(), nullable=False, server_default='pending'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['enrolled_by'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_tournament_enrollments_id'), 'tournament_enrollments', ['id'], unique=False)
        op.create_index(op.f('ix_tournament_enrollments_tournament_id'), 'tournament_enrollments', ['tournament_id'], unique=False)
        op.create_index(op.f('ix_tournament_enrollments_club_id'), 'tournament_enrollments', ['club_id'], unique=False)
    else:
        # Table exists, check if columns exist and add missing ones
        enrollment_columns = [col['name'] for col in inspector.get_columns('tournament_enrollments')]
        if 'enrolled_fee' not in enrollment_columns:
            op.add_column('tournament_enrollments', sa.Column('enrolled_fee', sa.Numeric(10, 2), nullable=False, server_default='0.00'))
        if 'payment_status' not in enrollment_columns:
            op.add_column('tournament_enrollments', sa.Column('payment_status', sa.String(), nullable=False, server_default='pending'))


def downgrade() -> None:
    """Remove enrollment fee, club_manager_id, and tournament_enrollments table"""
    
    # Drop tournament_enrollments table
    op.drop_index(op.f('ix_tournament_enrollments_club_id'), table_name='tournament_enrollments')
    op.drop_index(op.f('ix_tournament_enrollments_tournament_id'), table_name='tournament_enrollments')
    op.drop_index(op.f('ix_tournament_enrollments_id'), table_name='tournament_enrollments')
    op.drop_table('tournament_enrollments')
    
    # Remove club_manager_id from transactions
    op.drop_constraint('fk_transactions_club_manager_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'club_manager_id')
    
    # Remove enrollment_fee from tournament_details
    op.drop_column('tournament_details', 'enrollment_fee')


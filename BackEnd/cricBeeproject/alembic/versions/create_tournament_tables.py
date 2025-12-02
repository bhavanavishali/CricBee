"""create tournament tables

Revision ID: create_tournament_tables
Revises: 6ae00ee96001
Create Date: 2025-01-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'create_tournament_tables'
down_revision: Union[str, Sequence[str], None] = '6ae00ee96001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create tournaments table
    op.create_table(
        'tournaments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_name', sa.String(), nullable=False),
        sa.Column('organizer_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending_payment'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organizer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['plan_id'], ['tournament_pricing_plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tournaments_id'), 'tournaments', ['id'], unique=False)
    
    # Create tournament_details table
    op.create_table(
        'tournament_details',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('overs', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('registration_start_date', sa.Date(), nullable=False),
        sa.Column('registration_end_date', sa.Date(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('venue_details', sa.String(), nullable=True),
        sa.Column('team_range', sa.String(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tournament_id')
    )
    op.create_index(op.f('ix_tournament_details_id'), 'tournament_details', ['id'], unique=False)
    
    # Create tournament_payments table
    op.create_table(
        'tournament_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('razorpay_order_id', sa.String(), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(), nullable=True),
        sa.Column('razorpay_signature', sa.String(), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tournament_id')
    )
    op.create_index(op.f('ix_tournament_payments_id'), 'tournament_payments', ['id'], unique=False)
    op.create_index(op.f('ix_tournament_payments_razorpay_order_id'), 'tournament_payments', ['razorpay_order_id'], unique=True)
    op.create_index(op.f('ix_tournament_payments_razorpay_payment_id'), 'tournament_payments', ['razorpay_payment_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_tournament_payments_razorpay_payment_id'), table_name='tournament_payments')
    op.drop_index(op.f('ix_tournament_payments_razorpay_order_id'), table_name='tournament_payments')
    op.drop_index(op.f('ix_tournament_payments_id'), table_name='tournament_payments')
    op.drop_table('tournament_payments')
    op.drop_index(op.f('ix_tournament_details_id'), table_name='tournament_details')
    op.drop_table('tournament_details')
    op.drop_index(op.f('ix_tournaments_id'), table_name='tournaments')
    op.drop_table('tournaments')



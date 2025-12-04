"""add admin wallet and transaction tables

Revision ID: 1f3b2c5d709a
Revises: create_tournament_tables
Create Date: 2025-12-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f3b2c5d709a'
down_revision: Union[str, Sequence[str], None] = '6ae00ee96001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create admin wallet + transactions tables and extend payments"""
    # Check if admin_wallets table exists, create if not
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'admin_wallets' not in tables:
        op.create_table(
            'admin_wallets',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('admin_id', sa.Integer(), nullable=False),
            sa.Column('balance', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('admin_id')
        )
        op.create_index(op.f('ix_admin_wallets_id'), 'admin_wallets', ['id'], unique=False)

    if 'transactions' not in tables:
        op.create_table(
            'transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.String(), nullable=False),
            sa.Column('wallet_id', sa.Integer(), nullable=False),
            sa.Column('transaction_type', sa.String(), nullable=False),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False),
            sa.Column('status', sa.String(), nullable=False, server_default='pending'),
            sa.Column('tournament_id', sa.Integer(), nullable=True),
            sa.Column('razorpay_payment_id', sa.String(), nullable=True),
            sa.Column('razorpay_order_id', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ),
            sa.ForeignKeyConstraint(['wallet_id'], ['admin_wallets.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('transaction_id')
        )
        op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
        op.create_index(op.f('ix_transactions_transaction_id'), 'transactions', ['transaction_id'], unique=True)

    # Check if transaction_id column exists in tournament_payments
    if 'tournament_payments' in tables:
        columns = [col['name'] for col in inspector.get_columns('tournament_payments')]
        if 'transaction_id' not in columns:
            op.add_column('tournament_payments', sa.Column('transaction_id', sa.String(), nullable=True))
            op.create_index(op.f('ix_tournament_payments_transaction_id'), 'tournament_payments', ['transaction_id'], unique=False)


def downgrade() -> None:
    """Drop admin wallet + transactions tables and column"""
    op.drop_index(op.f('ix_tournament_payments_transaction_id'), table_name='tournament_payments')
    op.drop_column('tournament_payments', 'transaction_id')
    op.drop_index(op.f('ix_transactions_transaction_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_index(op.f('ix_admin_wallets_id'), table_name='admin_wallets')
    op.drop_table('admin_wallets')


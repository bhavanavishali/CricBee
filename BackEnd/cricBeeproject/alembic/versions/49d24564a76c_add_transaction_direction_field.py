"""add_transaction_direction_field

Revision ID: 49d24564a76c
Revises: 650be79a0b95
Create Date: 2025-12-04 11:00:15.830834

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49d24564a76c'
down_revision: Union[str, Sequence[str], None] = '650be79a0b95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add transaction_direction column to transactions table"""
    # Add the column with default value
    op.add_column('transactions', sa.Column('transaction_direction', sa.String(), nullable=False, server_default='credit'))
    
    # Update all existing transactions to 'credit' (admin receives money = credit)
    op.execute("UPDATE transactions SET transaction_direction = 'credit' WHERE transaction_direction IS NULL OR transaction_direction != 'credit'")


def downgrade() -> None:
    """Remove transaction_direction column from transactions table"""
    op.drop_column('transactions', 'transaction_direction')

"""update_existing_transactions_to_credit

Revision ID: 89d54bb2d54c
Revises: 49d24564a76c
Create Date: 2025-12-04 11:16:30.210632

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89d54bb2d54c'
down_revision: Union[str, Sequence[str], None] = '49d24564a76c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Update all existing transactions to credit (admin receives money = credit)"""
    op.execute("UPDATE transactions SET transaction_direction = 'credit' WHERE transaction_direction = 'debit' OR transaction_direction IS NULL")


def downgrade() -> None:
    """No downgrade needed - this is a data migration"""
    pass

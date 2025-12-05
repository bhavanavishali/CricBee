"""add_organizer_id_to_transactions

Revision ID: c06652b74667
Revises: 66519a34f1cf
Create Date: 2025-12-04 18:20:06.915243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c06652b74667'
down_revision: Union[str, Sequence[str], None] = '66519a34f1cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add organizer_id to transactions and make wallet_id nullable"""
    # Make wallet_id nullable
    op.alter_column('transactions', 'wallet_id',
                    existing_type=sa.Integer(),
                    nullable=True)
    
    # Add organizer_id column
    op.add_column('transactions', sa.Column('organizer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_transactions_organizer_id', 'transactions', 'users', ['organizer_id'], ['id'])


def downgrade() -> None:
    """Remove organizer_id and make wallet_id non-nullable"""
    op.drop_constraint('fk_transactions_organizer_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'organizer_id')
    op.alter_column('transactions', 'wallet_id',
                    existing_type=sa.Integer(),
                    nullable=False)

"""add_organizer_wallet_table

Revision ID: 66519a34f1cf
Revises: 89d54bb2d54c
Create Date: 2025-12-04 17:02:43.160415

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66519a34f1cf'
down_revision: Union[str, Sequence[str], None] = '89d54bb2d54c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

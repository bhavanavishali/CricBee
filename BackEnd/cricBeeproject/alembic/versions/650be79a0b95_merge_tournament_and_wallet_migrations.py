"""merge_tournament_and_wallet_migrations

Revision ID: 650be79a0b95
Revises: create_tournament_tables, 1f3b2c5d709a
Create Date: 2025-12-02 21:03:31.629707

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '650be79a0b95'
down_revision: Union[str, Sequence[str], None] = ('create_tournament_tables', '1f3b2c5d709a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

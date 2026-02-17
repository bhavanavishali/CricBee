"""add tournament_type to tournaments

Revision ID: add_tournament_type
Revises: 2c3c9559cb53
Create Date: 2025-12-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_tournament_type'
down_revision: Union[str, Sequence[str], None] = '2c3c9559cb53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('tournaments', sa.Column('tournament_type', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tournaments', 'tournament_type')


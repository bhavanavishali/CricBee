"""Add club_image column to clubs table

Revision ID: d688b0ad12dd
Revises: ab0d22e79f34
Create Date: 2025-11-22 19:54:18.467216

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd688b0ad12dd'
down_revision: Union[str, Sequence[str], None] = 'ab0d22e79f34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # This migration is a duplicate - club_image was already added in ab0d22e79f34
    # This is a no-op migration to maintain the migration chain
    # The column should already exist from ab0d22e79f34
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # No-op since this migration didn't actually add the column
    pass


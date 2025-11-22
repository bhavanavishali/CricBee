"""add_club_image_column

Revision ID: ab0d22e79f34
Revises: e8e2aa8e30a6
Create Date: 2025-11-22 19:03:23.409384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab0d22e79f34'
down_revision: Union[str, Sequence[str], None] = 'e8e2aa8e30a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clubs', sa.Column('club_image', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('clubs', 'club_image')

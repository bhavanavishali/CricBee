"""add_organization_image_column

Revision ID: bba14a6b2d6d
Revises: 56d3e314c164
Create Date: 2025-11-22 06:55:56.137261

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bba14a6b2d6d'
down_revision: Union[str, Sequence[str], None] = '56d3e314c164'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

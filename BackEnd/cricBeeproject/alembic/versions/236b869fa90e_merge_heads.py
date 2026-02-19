"""merge heads

Revision ID: 236b869fa90e
Revises: add_club_is_verified, add_streaming_url_to_matches
Create Date: 2026-02-19 12:08:50.819105

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '236b869fa90e'
down_revision: Union[str, Sequence[str], None] = ('add_club_is_verified', 'add_streaming_url_to_matches')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

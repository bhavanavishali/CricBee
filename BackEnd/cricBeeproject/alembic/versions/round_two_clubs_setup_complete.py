"""round_two_clubs_setup_complete

Revision ID: round_two_clubs_setup_complete
Revises: create_round_two_clubs
Create Date: 2026-01-26 20:05:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'round_two_clubs_setup_complete'
down_revision: Union[str, Sequence[str], None] = 'point_table_setup_complete'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # round_two_clubs table already exists, no operations needed
    pass


def downgrade() -> None:
    # No operations to downgrade
    pass

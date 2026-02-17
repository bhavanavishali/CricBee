"""create_round_progression

Revision ID: create_round_progression
Revises: round_two_clubs_setup_complete
Create Date: 2026-01-26 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'create_round_progression'
down_revision: Union[str, Sequence[str], None] = 'round_two_clubs_setup_complete'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # round_progression table already exists, no operations needed
    pass


def downgrade() -> None:
    # No operations to downgrade
    pass

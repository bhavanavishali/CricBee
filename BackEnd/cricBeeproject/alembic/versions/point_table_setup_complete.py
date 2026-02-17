"""point_table_setup_complete

Revision ID: point_table_setup_complete
Revises: add_winning_status
Create Date: 2026-01-26 17:50:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'point_table_setup_complete'
down_revision: Union[str, Sequence[str], None] = 'add_winning_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Point table already exists, no operations needed
    pass


def downgrade() -> None:
    # No operations to downgrade
    pass

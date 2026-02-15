"""add streaming_url to matches

Revision ID: add_streaming_url_to_matches
Revises: add_inning_no_and_winner_id
Create Date: 2026-02-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_streaming_url_to_matches'
down_revision: Union[str, Sequence[str], None] = 'add_inning_no_and_winner_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add streaming_url column to matches table
    op.add_column('matches', sa.Column('streaming_url', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove streaming_url from matches
    op.drop_column('matches', 'streaming_url')


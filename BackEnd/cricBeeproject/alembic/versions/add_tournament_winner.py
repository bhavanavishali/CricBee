"""add_tournament_winner

Revision ID: add_tournament_winner
Revises: create_round_progression
Create Date: 2026-01-27 10:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_tournament_winner'
down_revision: Union[str, Sequence[str], None] = 'create_round_progression'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tournaments', sa.Column('winner_team_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tournaments_winner_team_id', 'tournaments', 'clubs', ['winner_team_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_tournaments_winner_team_id', 'tournaments', type_='foreignkey')
    op.drop_column('tournaments', 'winner_team_id')

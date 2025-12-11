"""add toss fields and scoreboard tables

Revision ID: add_toss_and_scoreboard_tables
Revises: rename_is_published_to_is_fixture_published
Create Date: 2025-01-20 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_toss_and_scoreboard_tables'
down_revision: Union[str, None] = 'rename_is_published_to_is_fixture_published'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    """Add toss fields to matches table and create scoreboard tables"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Add toss-related fields to matches table
    if 'matches' in tables:
        columns = [col['name'] for col in inspector.get_columns('matches')]
        
        if 'toss_winner_id' not in columns:
            op.add_column('matches', sa.Column('toss_winner_id', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_matches_toss_winner', 'matches', 'clubs', ['toss_winner_id'], ['id'], ondelete='CASCADE')
        
        if 'toss_decision' not in columns:
            op.add_column('matches', sa.Column('toss_decision', sa.String(), nullable=True))  # 'bat' or 'bowl'
        
        if 'batting_team_id' not in columns:
            op.add_column('matches', sa.Column('batting_team_id', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_matches_batting_team', 'matches', 'clubs', ['batting_team_id'], ['id'], ondelete='CASCADE')
        
        if 'bowling_team_id' not in columns:
            op.add_column('matches', sa.Column('bowling_team_id', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_matches_bowling_team', 'matches', 'clubs', ['bowling_team_id'], ['id'], ondelete='CASCADE')
        
        if 'match_status' not in columns:
            op.add_column('matches', sa.Column('match_status', sa.String(), nullable=True, server_default='upcoming'))  # upcoming, live, completed, cancelled
    
    # Create match_scores table
    if 'match_scores' not in tables:
        op.create_table(
            'match_scores',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('match_id', sa.Integer(), nullable=False),
            sa.Column('team_id', sa.Integer(), nullable=False),
            sa.Column('runs', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('wickets', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('overs', sa.Numeric(5, 1), nullable=False, server_default='0.0'),
            sa.Column('balls', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('extras', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('fours', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('sixes', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('run_rate', sa.Numeric(5, 2), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['team_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('match_id', 'team_id', name='uq_match_team_score')
        )
        op.create_index(op.f('ix_match_scores_id'), 'match_scores', ['id'], unique=False)
        op.create_index(op.f('ix_match_scores_match_id'), 'match_scores', ['match_id'], unique=False)
        op.create_index(op.f('ix_match_scores_team_id'), 'match_scores', ['team_id'], unique=False)
    
    # Create ball_by_ball table
    if 'ball_by_ball' not in tables:
        op.create_table(
            'ball_by_ball',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('match_id', sa.Integer(), nullable=False),
            sa.Column('over_number', sa.Integer(), nullable=False),
            sa.Column('ball_number', sa.Integer(), nullable=False),
            sa.Column('batsman_id', sa.Integer(), nullable=True),
            sa.Column('bowler_id', sa.Integer(), nullable=True),
            sa.Column('runs', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('is_wicket', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('wicket_type', sa.String(), nullable=True),  # bowled, caught, lbw, run_out, stumped, etc.
            sa.Column('dismissed_batsman_id', sa.Integer(), nullable=True),
            sa.Column('is_wide', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_no_ball', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_bye', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_leg_bye', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_four', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_six', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('commentary', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['batsman_id'], ['player_profiles.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['bowler_id'], ['player_profiles.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['dismissed_batsman_id'], ['player_profiles.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ball_by_ball_id'), 'ball_by_ball', ['id'], unique=False)
        op.create_index(op.f('ix_ball_by_ball_match_id'), 'ball_by_ball', ['match_id'], unique=False)
        op.create_index(op.f('ix_ball_by_ball_over_ball'), 'ball_by_ball', ['match_id', 'over_number', 'ball_number'], unique=False)
    
    # Create player_match_stats table
    if 'player_match_stats' not in tables:
        op.create_table(
            'player_match_stats',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('match_id', sa.Integer(), nullable=False),
            sa.Column('player_id', sa.Integer(), nullable=False),
            sa.Column('team_id', sa.Integer(), nullable=False),
            sa.Column('runs', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('balls_faced', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('fours', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('sixes', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('strike_rate', sa.Numeric(5, 2), nullable=True),
            sa.Column('is_out', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('dismissal_type', sa.String(), nullable=True),
            sa.Column('dismissed_by_player_id', sa.Integer(), nullable=True),
            sa.Column('overs_bowled', sa.Numeric(5, 1), nullable=False, server_default='0.0'),
            sa.Column('maidens', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('runs_conceded', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('wickets_taken', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('economy', sa.Numeric(5, 2), nullable=True),
            sa.Column('is_batting', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_bowling', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['player_id'], ['player_profiles.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['team_id'], ['clubs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['dismissed_by_player_id'], ['player_profiles.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_player_match_stats_id'), 'player_match_stats', ['id'], unique=False)
        op.create_index(op.f('ix_player_match_stats_match_id'), 'player_match_stats', ['match_id'], unique=False)
        op.create_index(op.f('ix_player_match_stats_player_id'), 'player_match_stats', ['player_id'], unique=False)
        op.create_index(op.f('ix_player_match_stats_team_id'), 'player_match_stats', ['team_id'], unique=False)
        op.create_index(op.f('ix_player_match_stats_match_player'), 'player_match_stats', ['match_id', 'player_id'], unique=True)


def downgrade() -> None:
    """Remove toss fields and drop scoreboard tables"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Drop scoreboard tables
    if 'player_match_stats' in tables:
        op.drop_index(op.f('ix_player_match_stats_match_player'), table_name='player_match_stats')
        op.drop_index(op.f('ix_player_match_stats_team_id'), table_name='player_match_stats')
        op.drop_index(op.f('ix_player_match_stats_player_id'), table_name='player_match_stats')
        op.drop_index(op.f('ix_player_match_stats_match_id'), table_name='player_match_stats')
        op.drop_index(op.f('ix_player_match_stats_id'), table_name='player_match_stats')
        op.drop_table('player_match_stats')
    
    if 'ball_by_ball' in tables:
        op.drop_index(op.f('ix_ball_by_ball_over_ball'), table_name='ball_by_ball')
        op.drop_index(op.f('ix_ball_by_ball_match_id'), table_name='ball_by_ball')
        op.drop_index(op.f('ix_ball_by_ball_id'), table_name='ball_by_ball')
        op.drop_table('ball_by_ball')
    
    if 'match_scores' in tables:
        op.drop_index(op.f('ix_match_scores_team_id'), table_name='match_scores')
        op.drop_index(op.f('ix_match_scores_match_id'), table_name='match_scores')
        op.drop_index(op.f('ix_match_scores_id'), table_name='match_scores')
        op.drop_table('match_scores')
    
    # Remove toss fields from matches table
    if 'matches' in tables:
        columns = [col['name'] for col in inspector.get_columns('matches')]
        
        if 'match_status' in columns:
            op.drop_column('matches', 'match_status')
        
        if 'bowling_team_id' in columns:
            op.drop_constraint('fk_matches_bowling_team', 'matches', type_='foreignkey')
            op.drop_column('matches', 'bowling_team_id')
        
        if 'batting_team_id' in columns:
            op.drop_constraint('fk_matches_batting_team', 'matches', type_='foreignkey')
            op.drop_column('matches', 'batting_team_id')
        
        if 'toss_decision' in columns:
            op.drop_column('matches', 'toss_decision')
        
        if 'toss_winner_id' in columns:
            op.drop_constraint('fk_matches_toss_winner', 'matches', type_='foreignkey')
            op.drop_column('matches', 'toss_winner_id')






"""Add preferences column to users table

Revision ID: a079cb5878ac
Revises: ffd535e328b6
Create Date: 2026-02-22 02:20:27.401656
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = 'a079cb5878ac'
down_revision: Union[str, None] = 'ffd535e328b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add preferences column with default empty dict
    op.add_column('users', sa.Column('preferences', JSONB, nullable=False, server_default='{}'))

def downgrade() -> None:
    # Remove preferences column
    op.drop_column('users', 'preferences')

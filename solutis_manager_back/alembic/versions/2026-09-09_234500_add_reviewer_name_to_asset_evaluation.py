"""add reviewer_name to asset_technical_evaluation

Revision ID: e9f0a1b2c304
Revises: d8e9f0a1b203
Create Date: 2026-09-09 23:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e9f0a1b2c304"
down_revision: str | None = "d8e9f0a1b203"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("reviewer_name", sa.String(length=150), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "reviewer_name")

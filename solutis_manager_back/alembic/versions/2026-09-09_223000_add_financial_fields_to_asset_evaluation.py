"""add financial evaluation fields to asset_technical_evaluation

Revision ID: c7d8e9f0a102
Revises: f9a2b3c4d506
Create Date: 2026-09-09 22:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c7d8e9f0a102"
down_revision: str | None = "f9a2b3c4d506"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("usage_time", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("expected_lifespan", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "expected_lifespan")
    op.drop_column("asset_technical_evaluation", "usage_time")

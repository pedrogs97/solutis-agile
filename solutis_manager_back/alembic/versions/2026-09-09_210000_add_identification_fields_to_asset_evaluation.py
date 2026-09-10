"""add identification fields to asset_technical_evaluation

Revision ID: e8f3a1b9c205
Revises: d5e2f9a1b044
Create Date: 2026-09-09 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e8f3a1b9c205"
down_revision: str | None = "d5e2f9a1b044"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("manufacturer", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("model", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("current_location", sa.String(length=200), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column(
            "is_under_warranty",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=True,
        ),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("warranty_expiry_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("asset_description", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "asset_description")
    op.drop_column("asset_technical_evaluation", "warranty_expiry_date")
    op.drop_column("asset_technical_evaluation", "is_under_warranty")
    op.drop_column("asset_technical_evaluation", "current_location")
    op.drop_column("asset_technical_evaluation", "model")
    op.drop_column("asset_technical_evaluation", "manufacturer")

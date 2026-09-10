"""add document control fields to asset_technical_evaluation

Revision ID: d5e2f9a1b044
Revises: c4d1e8a2f301
Create Date: 2026-09-08 23:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5e2f9a1b044"
down_revision: str | None = "c4d1e8a2f301"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("document_start_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("document_end_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column(
            "document_classification",
            sa.String(length=50),
            server_default="USO INTERNO",
            nullable=True,
        ),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("elaborated_by_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("reviewed_by_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("approved_by_date", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "approved_by_date")
    op.drop_column("asset_technical_evaluation", "reviewed_by_date")
    op.drop_column("asset_technical_evaluation", "elaborated_by_date")
    op.drop_column("asset_technical_evaluation", "document_classification")
    op.drop_column("asset_technical_evaluation", "document_end_date")
    op.drop_column("asset_technical_evaluation", "document_start_date")

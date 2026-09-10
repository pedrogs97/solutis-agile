"""add asset management write off fields to asset_technical_evaluation

Revision ID: d8e9f0a1b203
Revises: c7d8e9f0a102
Create Date: 2026-09-09 23:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d8e9f0a1b203"
down_revision: str | None = "c7d8e9f0a102"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("write_off_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("write_off_reason", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("reused_parts_location", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("waste_final_destination", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("write_off_notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "write_off_notes")
    op.drop_column("asset_technical_evaluation", "waste_final_destination")
    op.drop_column("asset_technical_evaluation", "reused_parts_location")
    op.drop_column("asset_technical_evaluation", "write_off_reason")
    op.drop_column("asset_technical_evaluation", "write_off_date")

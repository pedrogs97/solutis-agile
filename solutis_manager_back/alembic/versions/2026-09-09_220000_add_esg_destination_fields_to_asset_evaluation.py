"""add esg destination fields to asset_technical_evaluation

Revision ID: f9a2b3c4d506
Revises: e8f3a1b9c205
Create Date: 2026-09-09 22:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f9a2b3c4d506"
down_revision: str | None = "e8f3a1b9c205"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("destination_company", sa.String(length=200), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("destination_cnpj", sa.String(length=30), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("destination_certificate", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("waste_manifest", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "waste_manifest")
    op.drop_column("asset_technical_evaluation", "destination_certificate")
    op.drop_column("asset_technical_evaluation", "destination_cnpj")
    op.drop_column("asset_technical_evaluation", "destination_company")

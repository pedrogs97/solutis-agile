"""add is_unregistered, unregistered_description and acquisition_date to asset_technical_evaluation

Revision ID: f0a1b2c3d405
Revises: e9f0a1b2c304
Create Date: 2026-09-21 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f0a1b2c3d405"
down_revision: str | None = "e9f0a1b2c304"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "asset_technical_evaluation",
        sa.Column(
            "is_unregistered",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("unregistered_description", sa.Text(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("acquisition_date", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("asset_technical_evaluation", "acquisition_date")
    op.drop_column("asset_technical_evaluation", "unregistered_description")
    op.drop_column("asset_technical_evaluation", "is_unregistered")

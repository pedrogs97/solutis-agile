"""add products column to user table

Revision ID: b7d2e9f1a043
Revises: a1e4c02f09b1
Create Date: 2026-09-06 23:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7d2e9f1a043"
down_revision: Union[str, None] = "a1e4c02f09b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add products column with server default 'agile,flow'
    op.add_column(
        "user",
        sa.Column(
            "products",
            sa.String(length=255),
            nullable=False,
            server_default="agile,flow",
        ),
    )

    # Ensure all existing users have 'agile,flow'
    op.execute(
        sa.text("UPDATE user SET products = 'agile,flow' WHERE products IS NULL OR products = ''")
    )


def downgrade() -> None:
    op.drop_column("user", "products")

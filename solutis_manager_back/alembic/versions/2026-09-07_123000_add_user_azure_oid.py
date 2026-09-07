"""add azure_oid column to user table

Revision ID: c4d1e8a2f301
Revises: b7d2e9f1a043
Create Date: 2026-09-07 12:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4d1e8a2f301"
down_revision: Union[str, None] = "b7d2e9f1a043"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "azure_oid",
            sa.String(length=255),
            nullable=True,
        ),
    )
    op.create_unique_constraint("uq_user_azure_oid", "user", ["azure_oid"])


def downgrade() -> None:
    op.drop_constraint("uq_user_azure_oid", "user", type_="unique")
    op.drop_column("user", "azure_oid")

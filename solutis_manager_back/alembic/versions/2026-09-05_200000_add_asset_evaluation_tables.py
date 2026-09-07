"""add asset evaluation tables (FO-PAT-02)

Revision ID: a1e4c02f09b1
Revises: cabf15fffa87
Create Date: 2026-09-05 20:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1e4c02f09b1"
down_revision: Union[str, None] = "cabf15fffa87"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BASE_COMPONENTS = [
    "RAM",
    "SSD",
    "HD",
    "Fonte",
    "CPU",
    "Placa-mãe",
    "Tela",
    "Bateria",
    "Cabos",
    "Teclado",
    "Mouse",
    "Estrutura metálica",
    "Madeira",
    "Ferragens",
    "Rodízios",
    "Prateleiras",
    "Outros",
]


def upgrade() -> None:
    # 1. Catálogo compartilhado de componentes
    catalog_table = op.create_table(
        "asset_catalog_component",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_asset_catalog_component_name",
        "asset_catalog_component",
        ["name"],
        unique=True,
    )

    # Carga inicial do catálogo
    op.bulk_insert(
        catalog_table,
        [{"name": name} for name in BASE_COMPONENTS],
    )

    # 2. Avaliação técnica principal (FO-PAT-02)
    op.create_table(
        "asset_technical_evaluation",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("protocol", sa.String(length=50), nullable=False),
        sa.Column("evaluation_date", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("asset_id", sa.Integer(), sa.ForeignKey("asset.id"), nullable=True),
        sa.Column("patrimonio", sa.String(length=100), nullable=True),
        sa.Column("asset_type_name", sa.String(length=150), nullable=True),
        sa.Column("brand_model", sa.String(length=200), nullable=True),
        sa.Column("serial_number", sa.String(length=255), nullable=True),
        sa.Column("cost_center", sa.String(length=200), nullable=True),
        sa.Column("unity", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="Rascunho", nullable=False),
        sa.Column("classification", sa.String(length=50), nullable=True),
        sa.Column("feasibility", sa.String(length=50), nullable=True),
        sa.Column("destination", sa.String(length=500), server_default="", nullable=True),
        sa.Column("gross_weight", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("reused_weight", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("discarded_weight", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("recycle_weight", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("reuse_percentage", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("acquisition_value", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("net_book_value", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("estimated_economy", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("justification", sa.Text(), nullable=True),
        sa.Column("technical_opinion", sa.Text(), nullable=True),
        sa.Column("evaluator_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("evaluator_name", sa.String(length=150), nullable=True),
        sa.Column("approver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approver_name", sa.String(length=150), nullable=True),
        sa.Column("approval_date", sa.DateTime(), nullable=True),
        sa.Column("approval_comments", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_asset_technical_evaluation_protocol",
        "asset_technical_evaluation",
        ["protocol"],
        unique=True,
    )

    # 3. Componentes avaliados na matriz
    op.create_table(
        "asset_evaluation_component",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column(
            "evaluation_id",
            sa.Integer(),
            sa.ForeignKey("asset_technical_evaluation.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default="1", nullable=False),
        sa.Column("condition", sa.String(length=50), server_default="Boa", nullable=False),
        sa.Column(
            "destination",
            sa.String(length=100),
            server_default="Reaproveitamento interno",
            nullable=False,
        ),
        sa.Column("observations", sa.String(length=255), nullable=True),
    )

    # 4. Anexos e evidências da avaliação
    op.create_table(
        "asset_evaluation_attachment",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column(
            "evaluation_id",
            sa.Integer(),
            sa.ForeignKey("asset_technical_evaluation.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("checklist_key", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("asset_evaluation_attachment")
    op.drop_table("asset_evaluation_component")
    op.drop_index("ix_asset_technical_evaluation_protocol", table_name="asset_technical_evaluation")
    op.drop_table("asset_technical_evaluation")
    op.drop_index("ix_asset_catalog_component_name", table_name="asset_catalog_component")
    op.drop_table("asset_catalog_component")

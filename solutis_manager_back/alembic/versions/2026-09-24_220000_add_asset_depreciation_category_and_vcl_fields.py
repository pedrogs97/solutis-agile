"""add asset_depreciation_category table and vcl fields to asset_technical_evaluation

Revision ID: b1c2d3e4f506
Revises: f0a1b2c3d405
Create Date: 2026-09-24 22:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f506"
down_revision: str | None = "f0a1b2c3d405"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CATEGORIAS_PADRAO = [
    {
        "name": "Computadores e periféricos",
        "annual_rate": 20.0,
        "useful_life_months": 60,
        "description": "Notebooks, desktops, servidores, monitores e periféricos de TI",
        "active": True,
    },
    {
        "name": "Veículos",
        "annual_rate": 20.0,
        "useful_life_months": 60,
        "description": "Veículos de transporte de carga e passageiros",
        "active": True,
    },
    {
        "name": "Máquinas e equipamentos",
        "annual_rate": 10.0,
        "useful_life_months": 120,
        "description": "Máquinas e aparelhos industriais e de suporte operacional",
        "active": True,
    },
    {
        "name": "Móveis e utensílios",
        "annual_rate": 10.0,
        "useful_life_months": 120,
        "description": "Mesas, cadeiras, armários e mobiliário corporativo",
        "active": True,
    },
    {
        "name": "Instalações",
        "annual_rate": 10.0,
        "useful_life_months": 120,
        "description": "Instalações elétricas, hidráulicas, divisórias e benfeitorias",
        "active": True,
    },
    {
        "name": "Edificações",
        "annual_rate": 4.0,
        "useful_life_months": 300,
        "description": "Prédios comerciais, galpões e construções",
        "active": True,
    },
    {
        "name": "Terrenos",
        "annual_rate": 0.0,
        "useful_life_months": 0,
        "description": "Bens imóveis e terrenos que não sofrem depreciação",
        "active": True,
    },
]


def upgrade() -> None:
    # 1. Criar tabela asset_depreciation_category
    category_table = op.create_table(
        "asset_depreciation_category",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("annual_rate", sa.Float(), nullable=False, server_default="20.0"),
        sa.Column("useful_life_months", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # 2. Seed das categorias padrão da Receita Federal
    op.bulk_insert(category_table, CATEGORIAS_PADRAO)

    # 3. Adicionar colunas novas em asset_technical_evaluation
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("depreciation_category_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("depreciation_category_name", sa.String(length=150), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("reference_date", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("residual_value", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("monthly_depreciation", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("depreciated_months", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "asset_technical_evaluation",
        sa.Column("accumulated_depreciation", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.create_foreign_key(
        "fk_asset_eval_depreciation_category",
        "asset_technical_evaluation",
        "asset_depreciation_category",
        ["depreciation_category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_asset_eval_depreciation_category", "asset_technical_evaluation", type_="foreignkey")
    op.drop_column("asset_technical_evaluation", "accumulated_depreciation")
    op.drop_column("asset_technical_evaluation", "depreciated_months")
    op.drop_column("asset_technical_evaluation", "monthly_depreciation")
    op.drop_column("asset_technical_evaluation", "residual_value")
    op.drop_column("asset_technical_evaluation", "reference_date")
    op.drop_column("asset_technical_evaluation", "depreciation_category_name")
    op.drop_column("asset_technical_evaluation", "depreciation_category_id")
    op.drop_table("asset_depreciation_category")

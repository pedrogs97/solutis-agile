"""Supplier evaluation model module"""

from datetime import date
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class SupplierEvaluation(SQLModel, table=True):
    """Supplier evaluation model"""

    __tablename__ = "supplier_evaluation"  # type: ignore

    id: int = Field(primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    evaluation_year: int
    period_type: str = Field(max_length=20)
    period_number: int
    evaluator_name: str = Field(max_length=255)
    evaluation_date: date
    final_score: Optional[Decimal] = Field(default=None, max_digits=5, decimal_places=2)

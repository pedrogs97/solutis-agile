"""Supplier evaluation repository module"""

from typing import List, Optional

from core.schemas import BaseModel
from core.utils.functions import format_date_br
from models.supplier import Supplier
from models.supplier_evaluation import SupplierEvaluation
from repositories.base import AbstractReportRepository, ModelT, Select
from schemas.report import SupplierEvaluationFilters
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession


class SupplierEvaluationResponse(BaseModel):
    """Supplier evaluation response."""

    id: int
    trade_name: str
    tax_id: str
    final_score: Optional[str]
    period: str
    evaluation_year: int
    evaluator_name: str
    evaluation_date: Optional[str]


class SupplierEvaluationRepository(
    AbstractReportRepository[SupplierEvaluationFilters, SupplierEvaluationResponse]
):
    """Supplier evaluation repository"""

    def __init__(self, session: AsyncSession):
        self.session = session

    def apply_filters(
        self, model: type[ModelT], query: Select, filters: SupplierEvaluationFilters
    ) -> Select:
        """Applies filters to the report data."""
        query = super().apply_filters(model, query, filters)

        if issubclass(model, Supplier) and (supplier_name := filters.supplier_name):
            query = query.where(Supplier.trade_name.icontains(supplier_name))

        if issubclass(model, SupplierEvaluation):
            if evaluator_name := filters.evaluator_name:
                query = query.where(
                    SupplierEvaluation.evaluator_name.icontains(evaluator_name)
                )
            if filters.start_period:
                query = query.where(
                    SupplierEvaluation.evaluation_date >= filters.start_period
                )
            if filters.end_period:
                query = query.where(
                    SupplierEvaluation.evaluation_date <= filters.end_period
                )

        if model is SupplierEvaluation and filters.start_period:
            query = query.where(
                SupplierEvaluation.evaluation_date >= filters.start_period
            )

        if model is SupplierEvaluation and filters.end_period:
            query = query.where(
                SupplierEvaluation.evaluation_date <= filters.end_period
            )

        return query

    async def fetch_report_data(
        self, filters: SupplierEvaluationFilters
    ) -> List[SupplierEvaluationResponse]:
        """Fetches report data from the database."""
        query = select(SupplierEvaluation, Supplier).join(
            Supplier, SupplierEvaluation.supplier_id == Supplier.id  # type: ignore
        )

        query = self.apply_filters(Supplier, query, filters)
        query = self.apply_filters(SupplierEvaluation, query, filters)

        result = await self.session.exec(query)
        rows = result.all()

        data: List[SupplierEvaluationResponse] = []
        for eval_obj, supplier_obj in rows:
            period_label = ""
            if eval_obj.period_type == "QUADRIMESTER":
                period_label = f"{eval_obj.period_number}º Quadrimestre"
            elif eval_obj.period_type == "SEMESTER":
                period_label = f"{eval_obj.period_number}º Semestre"

            data.append(
                SupplierEvaluationResponse(
                    id=eval_obj.id,
                    trade_name=supplier_obj.trade_name,
                    tax_id=supplier_obj.tax_id,
                    final_score=(
                        str(eval_obj.final_score)
                        if eval_obj.final_score is not None
                        else None
                    ),
                    period=period_label,
                    evaluation_year=eval_obj.evaluation_year,
                    evaluator_name=eval_obj.evaluator_name,
                    evaluation_date=format_date_br(
                        eval_obj.evaluation_date.isoformat()
                        if eval_obj.evaluation_date
                        else None
                    ),
                )
            )

        return data

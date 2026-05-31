"""Report schemas module"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from core.schemas import CamelBaseModel
from models.enums import ReportType
from pydantic import Field


class ReportFilterBase(CamelBaseModel):
    """Base filter for reports"""

    report_type: ReportType = Field(
        ..., description="Tipo do relatório (ex: 'supplier_evaluation')"
    )
    start_period: Optional[date] = Field(None, description="Data de inicio do período")
    end_period: Optional[date] = Field(None, description="Data de fim do período")


class SupplierEvaluationFilters(ReportFilterBase):
    """Specific filters for supplier evaluation report."""

    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    tax_id: Optional[str] = None
    evaluation_year: Optional[int] = None
    period_type: Optional[str] = None
    evaluator_name: Optional[str] = None


class ReportGenerateRequest(CamelBaseModel):
    """Generate report request."""

    report_type: str
    filters: Union[SupplierEvaluationFilters]


class ReportListRequest(ReportGenerateRequest):
    """List paginated report request."""

    limit: int = Field(default=10, ge=1)
    offset: int = Field(default=0, ge=0)


class ReportListResponse(CamelBaseModel):
    """Paginated report response."""

    cache_key: str
    total: int
    limit: int
    offset: int
    data: List[Dict[str, Any]]


class ReportGenerateResponse(CamelBaseModel):
    """Generate report response."""

    cache_key: str
    total: int
    message: str

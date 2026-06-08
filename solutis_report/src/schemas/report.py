"""Report schemas module"""

from datetime import date
from typing import Any, Dict, List, Optional, Union

from core.schemas import CamelBaseModel
from models.enums import ReportType
from pydantic import Field


class ReportFilterBase(CamelBaseModel):
    """Base filter for reports"""

    report_type: ReportType = Field(
        ..., description="Tipo do relatório (ex: 'supplier_evaluation', 'employee')"
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


class EmployeeReportFilters(ReportFilterBase):
    """Specific filters for employee report."""

    employees_ids: Optional[str] = Field(
        None, description="IDs dos colaboradores separados por vírgula"
    )
    roles_ids: Optional[str] = Field(
        None, description="IDs dos cargos separados por vírgula"
    )
    bus: Optional[str] = Field(None, description="BUs separados por vírgula")
    projects: Optional[str] = Field(None, description="Projetos separados por vírgula")
    business_executive: Optional[str] = Field(
        None, description="Executivos de negócio separados por vírgula"
    )
    workloads_ids: Optional[str] = Field(
        None, description="IDs das lotações separados por vírgula"
    )
    register_number: Optional[str] = Field(
        None, description="Patrimônios separados por vírgula"
    )
    patterns: Optional[str] = Field(
        None, description="Padrões de equipamento separados por vírgula"
    )
    status_ids: Optional[str] = Field(
        None, description="IDs dos status separados por vírgula"
    )
    cost_center_ids: Optional[str] = Field(
        None, description="IDs dos centros de custo separados por vírgula"
    )


class ReportGenerateRequest(CamelBaseModel):
    """Generate report request."""

    report_type: ReportType
    filters: Union[EmployeeReportFilters, SupplierEvaluationFilters]


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

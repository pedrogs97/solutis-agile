"""Depends module for report endpoints"""

from typing import Annotated

from core.database import get_session
from core.errors.exceptions import ReportException
from fastapi import Depends, Request, status
from models.enums import ReportType
from repositories.employee_report import EmployeeReportRepository
from repositories.supplier_evaluation import SupplierEvaluationRepository
from services.cache import AbstractCache, InMemoryReportCache
from services.employee_excel import EmployeeExcelGenerator
from services.excel import SupplierEvaluationExcelGenerator
from services.report_service import ReportService
from sqlmodel.ext.asyncio.session import AsyncSession

# Module-level singleton instance for in-memory cache
_report_cache = InMemoryReportCache()


def get_report_cache() -> AbstractCache:
    """
    Get report cache instance.

    Returns:
        AbstractCache: Cache instance.
    """
    return _report_cache


def get_report_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    cache: Annotated[AbstractCache, Depends(get_report_cache)],
) -> ReportService:
    """
    Get supplier evaluation report service.

    Args:
        session: Database session.
        cache: Cache instance.

    Returns:
        ReportService: Report service.
    """
    repository = SupplierEvaluationRepository(session)
    excel_generator = SupplierEvaluationExcelGenerator()
    return ReportService(repository, excel_generator, cache)


def get_employee_report_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    cache: Annotated[AbstractCache, Depends(get_report_cache)],
) -> ReportService:
    """
    Get employee report service.

    Args:
        session: Database session.
        cache: Cache instance.

    Returns:
        ReportService: Report service.
    """
    repository = EmployeeReportRepository(session)
    excel_generator = EmployeeExcelGenerator()
    return ReportService(repository, excel_generator, cache)


async def get_report_service_by_type(
    request: Request,
    supplier_service: Annotated[ReportService, Depends(get_report_service)],
    employee_service: Annotated[ReportService, Depends(get_employee_report_service)],
) -> ReportService:
    """
    Get the appropriate report service based on the report type in the request body.

    Args:
        request: FastAPI Request object.
        supplier_service: Supplier evaluation report service.
        employee_service: Employee report service.

    Returns:
        ReportService: The resolved report service.
    """
    try:
        body = await request.json()
    except Exception:
        raise ReportException(
            "Corpo da requisição inválido", status.HTTP_400_BAD_REQUEST
        )

    # Check both camelCase and snake_case to be robust
    report_type = body.get("reportType") or body.get("report_type")

    if report_type == ReportType.SUPPLIER_EVALUATION:
        return supplier_service
    if report_type == ReportType.EMPLOYEE:
        return employee_service

    raise ReportException(
        "Tipo de relatório não suportado", status.HTTP_400_BAD_REQUEST
    )

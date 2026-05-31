"""Depends module for report endpoints"""

from typing import Annotated

from core.database import get_session
from fastapi import Depends
from repositories.supplier_evaluation import SupplierEvaluationRepository
from services.cache import AbstractCache, InMemoryReportCache
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
    Get report service.

    Args:
        session: Database session.
        cache: Cache instance.

    Returns:
        ReportService: Report service.
    """
    repository = SupplierEvaluationRepository(session)
    excel_generator = SupplierEvaluationExcelGenerator()
    return ReportService(repository, excel_generator, cache)

"""Tests for ReportService with EmployeeReport"""

from io import BytesIO
from typing import Any, Dict, List

import pytest
from models.enums import ReportType
from pydantic import BaseModel
from repositories.base import AbstractReportRepository
from schemas.report import EmployeeReportFilters
from services.cache import InMemoryReportCache
from services.excel_generator import AbstractExcelGenerator
from services.report_service import ReportService


class DummyEmployeeResponse(BaseModel):
    employee: str
    code: str
    role: str
    status: str


class MockEmployeeRepository(AbstractReportRepository):
    async def fetch_report_data(self, filters: Any) -> List[Any]:
        return [
            DummyEmployeeResponse(
                employee="João",
                code="12345678901",
                role="Dev",
                status="Ativo",
            )
        ]


class MockEmployeeExcelGenerator(AbstractExcelGenerator):
    def generate(self, data: List[Dict[str, Any]]) -> BytesIO:
        return BytesIO(b"dummy employee excel data")

    def get_headers(self) -> List[str]:
        return ["COLABORADOR", "CPF", "CARGO", "STATUS"]

    def get_sheet_title(self) -> str:
        return "CONSULTA POR COLABORADOR"


@pytest.fixture
def cache():
    return InMemoryReportCache()


@pytest.fixture
def employee_service(cache):
    repo = MockEmployeeRepository()
    excel_gen = MockEmployeeExcelGenerator()
    return ReportService(repo, excel_gen, cache)


@pytest.mark.asyncio
async def test_generate_employee_report(employee_service, cache):
    """Test generating an employee report stores data in cache."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)
    cache_key, total = await employee_service.generate_report("employee", filters)

    assert total == 1
    assert cache_key is not None

    cached_data = cache.get("employee", filters)
    assert cached_data is not None
    assert cached_data[0]["employee"] == "João"


@pytest.mark.asyncio
async def test_get_paginated_employee_report_from_cache(employee_service, cache):
    """Test paginated retrieval from cache."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)
    cache.set(
        "employee",
        filters,
        [{"employee": f"Emp {i}", "code": str(i)} for i in range(20)],
    )

    cache_key, total, paginated_data = await employee_service.get_paginated_report(
        "employee", filters, limit=10, offset=0
    )

    assert total == 20
    assert len(paginated_data) == 10
    assert paginated_data[0]["employee"] == "Emp 0"
    assert paginated_data[9]["employee"] == "Emp 9"


@pytest.mark.asyncio
async def test_get_paginated_employee_report_second_page(employee_service, cache):
    """Test pagination for second page."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)
    cache.set(
        "employee",
        filters,
        [{"employee": f"Emp {i}"} for i in range(25)],
    )

    cache_key, total, paginated_data = await employee_service.get_paginated_report(
        "employee", filters, limit=10, offset=10
    )

    assert total == 25
    assert len(paginated_data) == 10
    assert paginated_data[0]["employee"] == "Emp 10"


@pytest.mark.asyncio
async def test_get_paginated_employee_report_fallback_db(employee_service):
    """Test fallback to DB when cache is empty."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)

    cache_key, total, paginated_data = await employee_service.get_paginated_report(
        "employee", filters, limit=10, offset=0
    )

    assert total == 1
    assert len(paginated_data) == 1
    assert paginated_data[0]["employee"] == "João"


@pytest.mark.asyncio
async def test_download_employee_excel_from_cache(employee_service, cache):
    """Test Excel download when data is in cache."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)
    cache.set("employee", filters, [{"employee": "João", "code": "123"}])

    excel_bytes = await employee_service.download_excel("employee", filters)
    assert excel_bytes.read() == b"dummy employee excel data"


@pytest.mark.asyncio
async def test_download_employee_excel_fallback_db(employee_service):
    """Test Excel download with fallback to DB."""
    filters = EmployeeReportFilters(report_type=ReportType.EMPLOYEE)

    excel_bytes = await employee_service.download_excel("employee", filters)
    assert excel_bytes.read() == b"dummy employee excel data"

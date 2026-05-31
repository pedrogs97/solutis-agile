from io import BytesIO
from typing import Any, Dict, List

import pytest
from pydantic import BaseModel
from repositories.base import AbstractReportRepository
from services.cache import InMemoryReportCache
from services.excel_generator import AbstractExcelGenerator
from services.report_service import ReportService


class DummyResponse(BaseModel):
    id: int
    name: str


class MockRepository(AbstractReportRepository):
    async def fetch_report_data(self, filters: Any) -> List[Any]:
        return [DummyResponse(id=1, name="Test")]


class MockExcelGenerator(AbstractExcelGenerator):
    def generate(self, data: List[Dict[str, Any]]) -> BytesIO:
        return BytesIO(b"dummy excel data")

    def get_headers(self) -> List[str]:
        return ["ID", "Name"]

    def get_sheet_title(self) -> str:
        return "Test Sheet"


@pytest.fixture
def cache():
    return InMemoryReportCache()


@pytest.fixture
def service(cache):
    repo = MockRepository()
    excel_gen = MockExcelGenerator()
    return ReportService(repo, excel_gen, cache)


from models.enums import ReportType
from schemas.report import SupplierEvaluationFilters


@pytest.mark.asyncio
async def test_generate_report(service, cache):
    filters = SupplierEvaluationFilters(report_type=ReportType.SUPPLIER_EVALUATION)
    cache_key, total = await service.generate_report("test_report", filters)

    assert total == 1
    assert cache_key is not None

    # Verifica se salvou no cache
    cached_data = cache.get("test_report", filters)
    assert cached_data == [{"id": 1, "name": "Test"}]


@pytest.mark.asyncio
async def test_get_paginated_report_from_cache(service, cache):
    filters = SupplierEvaluationFilters(report_type=ReportType.SUPPLIER_EVALUATION)
    # Insere no cache primeiro
    cache.set("test_report", filters, [{"id": i} for i in range(15)])

    cache_key, total, paginated_data = await service.get_paginated_report(
        "test_report", filters, limit=10, offset=0
    )

    assert total == 15
    assert len(paginated_data) == 10
    assert paginated_data[0]["id"] == 0
    assert paginated_data[-1]["id"] == 9


@pytest.mark.asyncio
async def test_get_paginated_report_fallback_db(service):
    filters = SupplierEvaluationFilters(report_type=ReportType.SUPPLIER_EVALUATION)
    # Não insere no cache
    cache_key, total, paginated_data = await service.get_paginated_report(
        "test_report", filters, limit=10, offset=0
    )

    # Deve buscar do mock_repo
    assert total == 1
    assert len(paginated_data) == 1
    assert paginated_data[0]["name"] == "Test"


@pytest.mark.asyncio
async def test_download_excel_from_cache(service, cache):
    filters = SupplierEvaluationFilters(report_type=ReportType.SUPPLIER_EVALUATION)
    cache.set("test_report", filters, [{"id": 1, "name": "Test"}])

    excel_bytes = await service.download_excel("test_report", filters)
    assert excel_bytes.read() == b"dummy excel data"


@pytest.mark.asyncio
async def test_download_excel_fallback_db(service):
    filters = SupplierEvaluationFilters(report_type=ReportType.SUPPLIER_EVALUATION)
    excel_bytes = await service.download_excel("test_report", filters)
    assert excel_bytes.read() == b"dummy excel data"

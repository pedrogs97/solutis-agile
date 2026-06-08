"""Tests for Employee Report API endpoints"""

from io import BytesIO
from unittest.mock import MagicMock

import pytest
from api.v1.depends.report import get_employee_report_service, get_report_cache
from httpx import ASGITransport, AsyncClient
from main import app
from services.report_service import ReportService


@pytest.fixture(autouse=True)
def clear_cache():
    get_report_cache().clear_all()
    yield


@pytest.fixture
def mock_employee_service():
    service = MagicMock(spec=ReportService)
    service.generate_report.return_value = ("employee_cache_key", 5)
    service.get_paginated_report.return_value = (
        "employee_cache_key",
        5,
        [
            {
                "employee": "João Silva",
                "code": "12345678901",
                "role": "Desenvolvedor",
                "status": "Ativo",
            }
        ],
    )
    service.download_excel.return_value = BytesIO(b"employee_excel_data")

    app.dependency_overrides[get_employee_report_service] = lambda: service
    yield service
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_generate_employee_report_endpoint(mock_employee_service):
    """Test POST /generate with report_type=employee."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/generate",
            json={
                "reportType": "employee",
                "filters": {"reportType": "employee"},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["cacheKey"] == "employee_cache_key"
    assert data["total"] == 5
    assert data["message"] == "Relatório gerado com sucesso"


@pytest.mark.asyncio
async def test_list_employee_report_endpoint(mock_employee_service):
    """Test POST /list with report_type=employee."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/list",
            json={
                "reportType": "employee",
                "filters": {"reportType": "employee"},
                "limit": 10,
                "offset": 0,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["cacheKey"] == "employee_cache_key"
    assert data["total"] == 5
    assert len(data["data"]) == 1
    assert data["data"][0]["employee"] == "João Silva"


@pytest.mark.asyncio
async def test_download_employee_report_endpoint(mock_employee_service):
    """Test POST /download with report_type=employee."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/download",
            json={
                "reportType": "employee",
                "filters": {"reportType": "employee"},
            },
        )

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert (
        "attachment; filename=relatorio_colaboradores.xlsx"
        in response.headers["content-disposition"]
    )
    assert response.content == b"employee_excel_data"


@pytest.mark.asyncio
async def test_generate_report_invalid_type():
    """Test that an invalid report_type returns 400."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/generate",
            json={
                "reportType": "invalid_type",
                "filters": {"reportType": "employee"},
            },
        )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_employee_report_with_filters(mock_employee_service):
    """Test POST /list with employee-specific filters."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/list",
            json={
                "reportType": "employee",
                "filters": {
                    "reportType": "employee",
                    "startPeriod": "2024-01-01",
                    "endPeriod": "2024-12-31",
                    "bus": "TI",
                    "statusIds": "1,2",
                },
                "limit": 50,
                "offset": 0,
            },
        )

    assert response.status_code == 200

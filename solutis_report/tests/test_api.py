from unittest.mock import MagicMock

import pytest
from api.v1.depends.report import (
    get_employee_report_service,
    get_report_cache,
    get_report_service,
)
from httpx import ASGITransport, AsyncClient
from main import app
from services.report_service import ReportService


@pytest.fixture(autouse=True)
def clear_cache():
    get_report_cache().clear_all()
    yield


@pytest.fixture
def mock_service():
    service = MagicMock(spec=ReportService)
    # Configurar retornos assíncronos
    service.generate_report.return_value = ("cache_key_123", 1)
    service.get_paginated_report.return_value = (
        "cache_key_123",
        1,
        [{"id": 1, "name": "Test"}],
    )

    # Para download_excel
    from io import BytesIO

    service.download_excel.return_value = BytesIO(b"excel_data")

    # Override FastAPI dependencies (both supplier and employee services)
    app.dependency_overrides[get_report_service] = lambda: service
    app.dependency_overrides[get_employee_report_service] = lambda: MagicMock(
        spec=ReportService
    )

    yield service

    # Clean up override
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_generate_report_endpoint(mock_service):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/generate",
            json={
                "reportType": "supplier_evaluation",
                "filters": {"reportType": "supplier_evaluation"},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["cacheKey"] == "cache_key_123"
    assert data["total"] == 1
    assert data["message"] == "Relatório gerado com sucesso"


@pytest.mark.asyncio
async def test_generate_report_invalid_type():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/generate",
            json={
                "reportType": "invalid_type",
                "filters": {"reportType": "supplier_evaluation"},
            },
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Tipo de relatório não suportado"


@pytest.mark.asyncio
async def test_list_report_endpoint(mock_service):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/list",
            json={
                "reportType": "supplier_evaluation",
                "filters": {"reportType": "supplier_evaluation"},
                "limit": 10,
                "offset": 0,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["cacheKey"] == "cache_key_123"
    assert data["total"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "Test"


@pytest.mark.asyncio
async def test_download_report_endpoint(mock_service):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/api/v1/reports/download",
            json={
                "reportType": "supplier_evaluation",
                "filters": {"reportType": "supplier_evaluation"},
            },
        )

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert (
        "attachment; filename=relatorio_fornecedores.xlsx"
        in response.headers["content-disposition"]
    )
    assert response.content == b"excel_data"

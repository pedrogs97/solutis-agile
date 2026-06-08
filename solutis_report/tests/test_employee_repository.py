"""Tests for EmployeeReportRepository"""

from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from models.asset import Asset
from models.cost_center import CostCenter
from models.employee import Employee, EmployeeRole
from models.enums import ReportType
from models.lending import Lending, LendingStatus, Workload
from repositories.employee_report import EmployeeReportRepository
from schemas.report import EmployeeReportFilters


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.mark.asyncio
async def test_fetch_report_data_basic(mock_session):
    """Test basic fetch with no optional filters."""
    # Arrange
    mock_result = MagicMock()

    lending = Lending(
        id=1,
        employee_id=1,
        asset_id=1,
        workload_id=1,
        status_id=1,
        cost_center_id=1,
        bu="TI",
        manager="Gestor A",
        business_executive="Exec A",
        project="Projeto X",
        location="Remoto",
        deleted=False,
        created_at=datetime(2024, 6, 1),
    )
    employee = Employee(
        id=1,
        full_name="João Silva",
        taxpayer_identification="12345678901",
        registration="12345",
        job_position="Desenvolvedor",
        role_id=1,
    )
    asset = Asset(
        id=1,
        description="Notebook Dell",
        register_number="PAT-001",
        pattern="Notebook Padrão",
    )
    workload = Workload(id=1, name="Home Office")
    status = LendingStatus(id=1, name="Ativo")
    cost_center = CostCenter(id=1, code="CC001", name="Centro Custo 1")
    role = EmployeeRole(id=1, code="DEV", name="Desenvolvedor")

    mock_result.all.return_value = [
        (lending, employee, asset, workload, status, cost_center, role)
    ]
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    # Act
    data = await repo.fetch_report_data(filters)

    # Assert
    assert len(data) == 1
    response = data[0]
    assert response.employee == "João Silva"
    assert response.code == "12345678901"
    assert response.role == "Desenvolvedor"
    assert response.project == "Projeto X"
    assert response.bu == "TI"
    assert response.cost_center == "Centro Custo 1"
    assert response.cost_center_code == "CC001"
    assert response.manager == "Gestor A"
    assert response.executive == "Exec A"
    assert response.workload == "Home Office"
    assert response.equipment_description == "Notebook Dell"
    assert response.patrimony == "PAT-001"
    assert response.equipment_standard == "Notebook Padrão"
    assert response.status == "Ativo"


@pytest.mark.asyncio
async def test_fetch_report_data_uses_taxpayer_when_available(mock_session):
    """When taxpayer_identification exists, it should be used as code."""
    mock_result = MagicMock()

    lending = Lending(
        id=1,
        employee_id=1,
        asset_id=1,
        workload_id=1,
        status_id=1,
        cost_center_id=1,
        deleted=False,
        created_at=datetime(2024, 6, 1),
    )
    employee = Employee(
        id=1,
        full_name="Maria",
        taxpayer_identification="98765432100",
        registration="99999",
    )
    asset = Asset(id=1, description="Monitor", register_number="PAT-002")
    workload = Workload(id=1, name="Presencial")
    status = LendingStatus(id=1, name="Inativo")
    cost_center = CostCenter(id=1, code="CC002", name="Centro 2")

    mock_result.all.return_value = [
        (lending, employee, asset, workload, status, cost_center, None)
    ]
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    data = await repo.fetch_report_data(filters)

    assert len(data) == 1
    assert data[0].code == "98765432100"


@pytest.mark.asyncio
async def test_fetch_report_data_uses_registration_when_no_taxpayer(mock_session):
    """When taxpayer_identification is None, use registration as code."""
    mock_result = MagicMock()

    lending = Lending(
        id=1,
        employee_id=1,
        asset_id=1,
        workload_id=1,
        status_id=1,
        cost_center_id=1,
        deleted=False,
        created_at=datetime(2024, 6, 1),
    )
    employee = Employee(
        id=1,
        full_name="Carlos",
        taxpayer_identification="",
        registration="00456",
    )
    asset = Asset(id=1, description="Teclado")
    workload = Workload(id=1, name="Híbrido")
    status = LendingStatus(id=1, name="Ativo")
    cost_center = CostCenter(id=1, code="CC003", name="Centro 3")

    mock_result.all.return_value = [
        (lending, employee, asset, workload, status, cost_center, None)
    ]
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    data = await repo.fetch_report_data(filters)

    assert data[0].code == "456"


@pytest.mark.asyncio
async def test_fetch_report_data_empty_result(mock_session):
    """Test with no data returned."""
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    data = await repo.fetch_report_data(filters)

    assert data == []


@pytest.mark.asyncio
async def test_fetch_report_data_uses_job_position_when_no_role(mock_session):
    """When role is None, use job_position for the role field."""
    mock_result = MagicMock()

    lending = Lending(
        id=1,
        employee_id=1,
        asset_id=1,
        workload_id=1,
        status_id=1,
        cost_center_id=1,
        deleted=False,
        created_at=datetime(2024, 6, 1),
    )
    employee = Employee(
        id=1,
        full_name="Ana",
        taxpayer_identification="11122233344",
        job_position="Analista de Sistemas",
        role_id=None,
    )
    asset = Asset(id=1, description="Mouse", register_number="PAT-003")
    workload = Workload(id=1, name="Presencial")
    status = LendingStatus(id=1, name="Ativo")
    cost_center = CostCenter(id=1, code="CC004", name="Centro 4")

    mock_result.all.return_value = [
        (lending, employee, asset, workload, status, cost_center, None)
    ]
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    data = await repo.fetch_report_data(filters)

    assert data[0].role == "Analista de Sistemas"


@pytest.mark.asyncio
async def test_fetch_report_data_not_provided_defaults(mock_session):
    """Test default values when cost center or fields are missing."""
    mock_result = MagicMock()

    lending = Lending(
        id=1,
        employee_id=1,
        asset_id=1,
        workload_id=1,
        status_id=1,
        cost_center_id=1,
        deleted=False,
        created_at=datetime(2024, 6, 1),
    )
    employee = Employee(
        id=1,
        full_name="Pedro",
        taxpayer_identification="55566677788",
    )
    asset = Asset(id=1, description="Headset")
    workload = Workload(id=1, name="Home Office")
    status = LendingStatus(id=1, name="Ativo")

    mock_result.all.return_value = [
        (lending, employee, asset, workload, status, None, None)
    ]
    mock_session.exec.return_value = mock_result

    repo = EmployeeReportRepository(mock_session)
    filters = EmployeeReportFilters(
        report_type=ReportType.EMPLOYEE,
        start_period=date(2024, 1, 1),
        end_period=date(2024, 12, 31),
    )

    data = await repo.fetch_report_data(filters)

    assert data[0].cost_center == "Não informado"
    assert data[0].cost_center_code == "Não informado"

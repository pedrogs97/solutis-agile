"""Employee report repository module"""

from typing import List, Optional

from core.schemas import BaseModel
from models.asset import Asset
from models.cost_center import CostCenter
from models.employee import Employee, EmployeeRole
from models.lending import Lending, LendingStatus, Workload
from repositories.base import AbstractReportRepository
from schemas.report import EmployeeReportFilters
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

NOT_PROVIDED = "Não informado"


class EmployeeReportResponse(BaseModel):
    """Employee report response."""

    employee: str
    code: str
    role: Optional[str]
    project: Optional[str]
    bu: Optional[str]
    cost_center: str
    cost_center_code: str
    manager: Optional[str]
    executive: Optional[str]
    workload: str
    equipment_description: Optional[str]
    patrimony: Optional[str]
    equipment_standard: Optional[str]
    status: str


def _parse_ids(value: Optional[str]) -> Optional[List[int]]:
    """Parse comma-separated string of IDs into a list of ints."""
    if not value:
        return None
    try:
        return [int(str_id.strip()) for str_id in value.split(",")]
    except ValueError:
        return None


def _parse_strings(value: Optional[str]) -> Optional[List[str]]:
    """Parse comma-separated string into a list of strings."""
    if not value:
        return None
    return [s.strip() for s in value.split(",")]


def _resolve_code(employee: Employee) -> str:
    """Resolve employee code: prefer taxpayer_identification, fallback to registration."""
    if employee.taxpayer_identification:
        return employee.taxpayer_identification

    if employee.registration:
        if employee.registration.isdigit():
            return str(int(employee.registration))
        return employee.registration

    return NOT_PROVIDED


class EmployeeReportRepository(
    AbstractReportRepository[EmployeeReportFilters, EmployeeReportResponse]
):
    """Employee report repository"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_report_data(
        self, filters: EmployeeReportFilters
    ) -> List[EmployeeReportResponse]:
        """Fetches employee report data from the database."""
        query = (
            select(
                Lending,
                Employee,
                Asset,
                Workload,
                LendingStatus,
                CostCenter,
                EmployeeRole,
            )
            .join(Employee, Lending.employee_id == Employee.id)  # type: ignore
            .join(Asset, Lending.asset_id == Asset.id)  # type: ignore
            .join(Workload, Lending.workload_id == Workload.id)  # type: ignore
            .join(LendingStatus, Lending.status_id == LendingStatus.id)  # type: ignore
            .outerjoin(CostCenter, Lending.cost_center_id == CostCenter.id)  # type: ignore
            .outerjoin(EmployeeRole, Employee.role_id == EmployeeRole.id)  # type: ignore
            .where(not Lending.deleted)
        )

        # Date filters
        if filters.start_period:
            query = query.where(Lending.created_at >= filters.start_period)
        if filters.end_period:
            query = query.where(Lending.created_at <= filters.end_period)

        # Apply optional filters
        employees_ids = _parse_ids(filters.employees_ids)
        if employees_ids:
            query = query.where(Employee.id.in_(employees_ids))  # type: ignore

        roles_ids = _parse_ids(filters.roles_ids)
        if roles_ids:
            query = query.where(Employee.role_id.in_(roles_ids))  # type: ignore

        bus_list = _parse_strings(filters.bus)
        if bus_list:
            query = query.where(Lending.bu.in_(bus_list))  # type: ignore

        projects_list = _parse_strings(filters.projects)
        if projects_list:
            query = query.where(Lending.project.in_(projects_list))  # type: ignore

        executive_list = _parse_strings(filters.business_executive)
        if executive_list:
            query = query.where(Lending.business_executive.in_(executive_list))  # type: ignore

        workloads_ids = _parse_ids(filters.workloads_ids)
        if workloads_ids:
            query = query.where(Workload.id.in_(workloads_ids))  # type: ignore

        register_numbers = _parse_strings(filters.register_number)
        if register_numbers:
            query = query.where(Asset.register_number.in_(register_numbers))  # type: ignore

        patterns_list = _parse_strings(filters.patterns)
        if patterns_list:
            query = query.where(Asset.pattern.in_(patterns_list))  # type: ignore

        status_ids = _parse_ids(filters.status_ids)
        if status_ids:
            query = query.where(Lending.status_id.in_(status_ids))  # type: ignore

        cost_center_ids = _parse_ids(filters.cost_center_ids)
        if cost_center_ids:
            query = query.where(CostCenter.id.in_(cost_center_ids))  # type: ignore

        result = await self.session.exec(query)
        rows = result.all()

        data: List[EmployeeReportResponse] = []
        for lending, employee, asset, workload, status, cost_center, role in rows:
            role_name = role.name if role else (employee.job_position or NOT_PROVIDED)

            data.append(
                EmployeeReportResponse(
                    employee=employee.full_name,
                    code=_resolve_code(employee),
                    role=role_name,
                    project=lending.project,
                    bu=lending.bu,
                    cost_center=(cost_center.name if cost_center else NOT_PROVIDED),
                    cost_center_code=(
                        cost_center.code if cost_center else NOT_PROVIDED
                    ),
                    manager=lending.manager,
                    executive=lending.business_executive,
                    workload=workload.name,
                    equipment_description=asset.description,
                    patrimony=asset.register_number,
                    equipment_standard=asset.pattern,
                    status=status.name,
                )
            )

        return data

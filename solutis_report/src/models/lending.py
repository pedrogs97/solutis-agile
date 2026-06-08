"""Lending model module"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Workload(SQLModel, table=True):
    """Workload model (maps to workload table)"""

    __tablename__ = "workload"  # type: ignore

    id: int = Field(primary_key=True)
    name: str = Field(max_length=12)


class LendingStatus(SQLModel, table=True):
    """Lending status model (maps to lending_status table)"""

    __tablename__ = "lending_status"  # type: ignore

    id: int = Field(primary_key=True)
    name: str = Field(max_length=40)


class Lending(SQLModel, table=True):
    """Lending model (maps to lending table)"""

    __tablename__ = "lending"  # type: ignore

    id: int = Field(primary_key=True)
    employee_id: int = Field(foreign_key="employees.id")
    asset_id: int = Field(foreign_key="assets.id")
    workload_id: Optional[int] = Field(default=None, foreign_key="workload.id")
    status_id: Optional[int] = Field(default=None, foreign_key="lending_status.id")
    cost_center_id: int = Field(foreign_key="cost_centers_totvs.id")
    bu: Optional[str] = Field(default=None, max_length=5)
    manager: Optional[str] = Field(default=None, max_length=50)
    business_executive: Optional[str] = Field(default=None, max_length=50)
    project: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=100)
    deleted: bool = Field(default=False)
    created_at: Optional[datetime] = Field(default=None)

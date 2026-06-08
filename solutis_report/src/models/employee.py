"""Employee model module"""

from typing import Optional

from sqlmodel import Field, SQLModel


class EmployeeRole(SQLModel, table=True):
    """Employee role model (maps to roles_totvs table)"""

    __tablename__ = "roles_totvs"  # type: ignore

    id: int = Field(primary_key=True)
    code: str = Field(max_length=10)
    name: str = Field(max_length=100)


class Employee(SQLModel, table=True):
    """Employee model (maps to employees table)"""

    __tablename__ = "employees"  # type: ignore

    id: int = Field(primary_key=True)
    full_name: str = Field(max_length=120)
    taxpayer_identification: str = Field(max_length=11)
    registration: Optional[str] = Field(default=None, max_length=16)
    job_position: Optional[str] = Field(default=None, max_length=200)
    role_id: Optional[int] = Field(default=None, foreign_key="roles_totvs.id")

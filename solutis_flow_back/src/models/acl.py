from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class FlowRole(str, Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    ANALISTA = "ANALISTA"
    SOLICITANTE = "SOLICITANTE"
    APROVADOR = "APROVADOR"
    OBSERVADOR = "OBSERVADOR"


class UserRoleMapping(SQLModel, table=True):
    __tablename__ = "flow_user_role_mappings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)  # Indexed Integer to manager_backend User ID
    role: FlowRole = Field(default=FlowRole.SOLICITANTE, index=True)
    area_id: Optional[int] = Field(default=None, foreign_key="flow_areas.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

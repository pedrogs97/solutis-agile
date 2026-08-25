from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class DemandType(str, Enum):
    COMPRAS = "COMPRAS"
    REEMBOLSO = "REEMBOLSO"
    CONTRATOS = "CONTRATOS"
    INVENTARIO = "INVENTARIO"
    ESG = "ESG"
    ESPORADICA = "ESPORADICA"


class DemandStatus(str, Enum):
    PENDENTE = "PENDENTE"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"


class ApprovalStatus(str, Enum):
    NENHUMA = "NENHUMA"
    AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO"
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"


class DemandPriority(str, Enum):
    ALTA = "ALTA"
    MEDIA = "MEDIA"
    BAIXA = "BAIXA"


class Demand(SQLModel, table=True):
    __tablename__ = "flow_demands"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: DemandType = Field(default=DemandType.ESPORADICA, index=True)
    title: str
    description: str = ""

    # User references (Indexed integers to manager_backend User ID)
    solicitor_user_id: int = Field(index=True)
    assignee_user_id: Optional[int] = Field(default=None, index=True)
    manager_user_id: int = Field(index=True)

    priority: DemandPriority = Field(default=DemandPriority.MEDIA)
    status: DemandStatus = Field(default=DemandStatus.PENDENTE, index=True)
    approval_status: ApprovalStatus = Field(default=ApprovalStatus.NENHUMA, index=True)

    # SLA & Time Tracking
    sla_limit_hours: int = Field(default=24)
    sla_spent_hours: int = Field(default=0)
    due_date: Optional[datetime] = None

    time_estimated_hours: float = Field(default=1.0)
    time_spent_hours: float = Field(default=0.0)

    # Organizational references (Local FKs)
    area_id: Optional[int] = Field(default=None, foreign_key="flow_areas.id")
    cost_center_id: Optional[int] = Field(default=None, foreign_key="flow_cost_centers.id")
    project_id: Optional[int] = Field(default=None, foreign_key="flow_projects.id")

    # Mandatory Execution Evidence for CONCLUIDO
    evidence_description: Optional[str] = None
    evidence_attachment_id: Optional[int] = None

    # Current workflow stage index
    current_stage_index: int = Field(default=0)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

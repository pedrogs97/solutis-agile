from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class AlertType(str, Enum):
    PRE_ALERTA = "PRE_ALERTA"
    ALERTA_DO_DIA = "ALERTA_DO_DIA"


class Alert(SQLModel, table=True):
    __tablename__ = "flow_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True)
    alert_type: AlertType
    scheduled_for: datetime
    is_sent: bool = Field(default=False, index=True)
    sent_at: Optional[datetime] = None

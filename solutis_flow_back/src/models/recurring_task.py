from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class Frequency(str, Enum):
    DIARIA = "DIARIA"
    SEMANAL = "SEMANAL"
    QUINZENAL = "QUINZENAL"
    MENSAL = "MENSAL"


class RecurringTask(SQLModel, table=True):
    __tablename__ = "flow_recurring_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    frequency: Frequency
    area_id: Optional[int] = Field(default=None, foreign_key="flow_areas.id")
    cost_center_id: Optional[int] = Field(default=None, foreign_key="flow_cost_centers.id")
    checklist_json: str = "[]"  # JSON list of items
    last_generated: Optional[datetime] = None
    next_generation: Optional[datetime] = None
    is_active: bool = Field(default=True)

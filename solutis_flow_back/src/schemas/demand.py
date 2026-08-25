from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from src.models.demand import DemandPriority, DemandStatus, DemandType, ApprovalStatus


class DemandCreate(BaseModel):
    type: DemandType = DemandType.ESPORADICA
    title: str
    description: str = ""
    assignee_user_id: Optional[int] = None
    manager_user_id: int
    observer_user_ids: List[int] = []
    priority: DemandPriority = DemandPriority.MEDIA
    sla_limit_hours: int = 24
    due_date: Optional[datetime] = None
    time_estimated_hours: float = 1.0
    area_id: Optional[int] = None
    cost_center_id: Optional[int] = None
    project_id: Optional[int] = None


class DemandStatusUpdate(BaseModel):
    status: DemandStatus
    evidence_description: Optional[str] = None
    evidence_attachment_id: Optional[int] = None


class TransferCreate(BaseModel):
    target_assignee_user_id: int
    justification: str


class FeedbackCreate(BaseModel):
    rating: int
    comment: str = ""
    is_negative: bool = False


class DemandResponse(BaseModel):
    id: int
    type: DemandType
    title: str
    description: str
    solicitor_user_id: int
    assignee_user_id: Optional[int]
    manager_user_id: int
    observer_user_ids: List[int] = []
    priority: DemandPriority
    status: DemandStatus
    approval_status: ApprovalStatus
    sla_limit_hours: int
    sla_spent_hours: int
    due_date: Optional[datetime]
    time_estimated_hours: float
    time_spent_hours: float
    area_id: Optional[int]
    cost_center_id: Optional[int]
    project_id: Optional[int]
    evidence_description: Optional[str]
    evidence_attachment_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

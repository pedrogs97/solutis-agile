from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class TransferStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TransferRequest(SQLModel, table=True):
    __tablename__ = "flow_transfer_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True)
    previous_assignee_user_id: int = Field(index=True)
    target_assignee_user_id: int = Field(index=True)
    justification: str
    status: TransferStatus = Field(default=TransferStatus.PENDING, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

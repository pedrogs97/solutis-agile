from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Attachment(SQLModel, table=True):
    __tablename__ = "flow_attachments"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True)
    name: str
    size: str
    url: str
    uploaded_by_user_id: int = Field(index=True)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

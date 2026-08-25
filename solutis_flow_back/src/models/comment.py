from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Comment(SQLModel, table=True):
    __tablename__ = "flow_comments"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True)
    user_id: int = Field(index=True)
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

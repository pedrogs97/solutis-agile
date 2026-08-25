from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Feedback(SQLModel, table=True):
    __tablename__ = "flow_feedbacks"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True, unique=True)
    manager_user_id: int = Field(index=True)
    rating: int = Field(default=5)  # 1 to 5
    comment: str = ""
    is_negative: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

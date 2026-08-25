from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "flow_projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    status: str = Field(default="EM_ANDAMENTO")  # PLANEJADO, EM_ANDAMENTO, CONCLUIDO, ATRASADO
    due_date: Optional[datetime] = None
    area_id: Optional[int] = Field(default=None, foreign_key="flow_areas.id")
    creator_user_id: int = Field(index=True)  # Indexed Integer to manager_backend User ID

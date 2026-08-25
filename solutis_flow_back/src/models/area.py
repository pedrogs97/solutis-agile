from typing import Optional
from sqlmodel import Field, SQLModel


class Area(SQLModel, table=True):
    __tablename__ = "flow_areas"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""

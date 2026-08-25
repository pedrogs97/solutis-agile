from typing import Optional
from sqlmodel import Field, SQLModel


class CostCenter(SQLModel, table=True):
    __tablename__ = "flow_cost_centers"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str

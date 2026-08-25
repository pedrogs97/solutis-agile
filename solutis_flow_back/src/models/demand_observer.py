from typing import Optional
from sqlmodel import Field, SQLModel


class DemandObserver(SQLModel, table=True):
    __tablename__ = "flow_demand_observers"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(foreign_key="flow_demands.id", index=True)
    observer_user_id: int = Field(index=True)  # Indexed Integer to manager_backend User ID

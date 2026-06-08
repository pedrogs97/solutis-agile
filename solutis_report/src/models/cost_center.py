"""Cost center model module"""

from sqlmodel import Field, SQLModel


class CostCenter(SQLModel, table=True):
    """Cost center model (maps to cost_centers_totvs table)"""

    __tablename__ = "cost_centers_totvs"  # type: ignore

    id: int = Field(primary_key=True)
    code: str = Field(max_length=25)
    name: str = Field(max_length=60)

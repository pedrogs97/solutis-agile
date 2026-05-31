"""Supplier model module"""

from sqlmodel import Field, SQLModel


class Supplier(SQLModel, table=True):
    """Supplier model"""

    __tablename__ = "supplier"  # type: ignore

    id: int = Field(primary_key=True)
    trade_name: str = Field(default="", max_length=255)
    legal_name: str = Field(max_length=255, unique=True)
    tax_id: str = Field(max_length=18, unique=True)

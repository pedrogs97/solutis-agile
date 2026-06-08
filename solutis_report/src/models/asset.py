"""Asset model module"""

from typing import Optional

from sqlmodel import Field, SQLModel


class Asset(SQLModel, table=True):
    """Asset model (maps to assets table)"""

    __tablename__ = "asset"  # type: ignore

    id: int = Field(primary_key=True)
    description: Optional[str] = Field(default=None, max_length=240)
    register_number: Optional[str] = Field(default=None, max_length=30)
    pattern: Optional[str] = Field(default=None, max_length=255)

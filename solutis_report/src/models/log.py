"""Log model module"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Log(SQLModel, table=True):
    """Log model (maps to logs table)"""

    __tablename__ = "logs"  # type: ignore

    id: int = Field(primary_key=True)
    user_id: int
    module: str = Field(max_length=100)
    model: str = Field(max_length=100)
    operation: str = Field(max_length=100)
    identifier: int
    logged_in: Optional[datetime] = Field(default=None)

"""Abstract report repository module"""

from abc import ABC, abstractmethod
from typing import Generic, List, Type, TypeVar

from pydantic import BaseModel
from sqlmodel import SQLModel
from sqlmodel.sql.expression import Select

FilterT = TypeVar("FilterT", bound=BaseModel)
ResponseT = TypeVar("ResponseT", bound=BaseModel)
ModelT = TypeVar("ModelT", bound=SQLModel)


class AbstractReportRepository(Generic[FilterT, ResponseT], ABC):
    """Abstract report repository."""

    @abstractmethod
    async def fetch_report_data(self, filters: FilterT) -> List[ResponseT]:
        """Fetches report data from the database."""

    def apply_filters(
        self, model: Type[ModelT], query: Select, filters: FilterT
    ) -> Select:
        """Applies filters to the report data."""
        filter_dict = filters.model_dump(exclude_none=True)

        for key, value in filter_dict.items():
            if value is not None and hasattr(model, key):
                query = query.where(getattr(model, key) == value)

        return query

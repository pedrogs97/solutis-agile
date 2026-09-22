"""Shared schemas for the project."""

from typing import Any

from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    """Paginated list response."""

    count: int
    next: str | None = None
    previous: str | None = None
    results: list[dict[str, Any]]

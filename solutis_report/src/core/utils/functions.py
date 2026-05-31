"""Core utility functions for the application"""

from typing import Optional


def format_date_br(value_str: Optional[str]) -> str:
    """Format ISO date/date-like values as dd/mm/yyyy."""
    if not value_str:
        return ""

    if "/" in value_str:
        return value_str

    date_part = value_str.split("T")[0]
    parts = date_part.split("-")
    if len(parts) != 3:
        return value_str

    year, month, day = parts
    return f"{day}/{month}/{year}"

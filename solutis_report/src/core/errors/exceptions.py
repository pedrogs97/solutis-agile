"""Custom exceptions module"""

from fastapi import HTTPException


class ReportException(HTTPException):
    """Custom exception for report errors."""

    def __init__(self, message: str, status_code: int):
        super().__init__(status_code=status_code, detail=message)

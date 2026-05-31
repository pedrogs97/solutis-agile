"""Abstract excel generator module"""

from abc import ABC, abstractmethod
from io import BytesIO
from typing import Any, Dict, List


class AbstractExcelGenerator(ABC):
    """Abstract excel generator."""

    @abstractmethod
    def generate(self, data: List[Dict[str, Any]]) -> BytesIO:
        """Generates an Excel file from the data."""

    @abstractmethod
    def get_headers(self) -> List[str]:
        """Returns the headers for the Excel file."""

    @abstractmethod
    def get_sheet_title(self) -> str:
        """Returns the Excel sheet title."""

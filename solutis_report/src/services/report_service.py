"""Report service module"""

from io import BytesIO
from typing import Dict, List, Tuple

from pydantic import BaseModel
from repositories.base import AbstractReportRepository
from services.cache import AbstractCache
from services.excel_generator import AbstractExcelGenerator


class ReportService:
    """Report service."""

    def __init__(
        self,
        repository: AbstractReportRepository,
        excel_generator: AbstractExcelGenerator,
        cache: AbstractCache,
    ):
        self.repository = repository
        self.excel_generator = excel_generator
        self.cache = cache

    async def generate_report(
        self, report_type: str, filters: BaseModel
    ) -> Tuple[str, int]:
        """Generate report and store it in cache."""
        data = await self.repository.fetch_report_data(filters)
        cache_key = self.cache.set(report_type, filters, [d.model_dump() for d in data])
        return cache_key, len(data)

    async def get_paginated_report(
        self,
        report_type: str,
        filters: BaseModel,
        limit: int,
        offset: int,
    ) -> Tuple[str, int, List[Dict]]:
        """Get paginated report."""
        data = self.cache.get(report_type, filters)
        cache_key = self.cache.generate_key(report_type, filters)

        if data is None:
            cache_key, _ = await self.generate_report(report_type, filters)
            data = self.cache.get(report_type, filters)

        total = len(data) if data else 0
        paginated_data = data[offset : offset + limit] if data else []

        return cache_key, total, paginated_data

    async def download_excel(self, report_type: str, filters: BaseModel) -> BytesIO:
        """Download excel report."""
        data = self.cache.get(report_type, filters)

        if data is None:
            await self.generate_report(report_type, filters)
            data = self.cache.get(report_type, filters)

        return self.excel_generator.generate(data or [])

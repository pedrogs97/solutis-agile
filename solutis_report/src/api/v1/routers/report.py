"""Router module for report API endpoints"""

from typing import Annotated

from api.v1.depends.report import get_report_service_by_type
from core.utils.mappers import REPORT_FILENAMES
from fastapi import APIRouter, Depends, Response
from schemas.report import (
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportListRequest,
    ReportListResponse,
)
from services.report_service import ReportService

report_router = APIRouter(prefix="/reports", tags=["Reports"])


@report_router.post("/generate", response_model=ReportGenerateResponse)
async def generate_report(
    request: ReportGenerateRequest,
    service: Annotated[ReportService, Depends(get_report_service_by_type)],
):
    """Generate a report and store it in cache.

    Args:
        request: Report generation request.
        service: Resolved report service.

    Returns:
        ReportGenerateResponse: Report generation response.
    """
    cache_key, total = await service.generate_report(
        request.report_type, request.filters
    )
    return ReportGenerateResponse(
        cache_key=cache_key, total=total, message="Relatório gerado com sucesso"
    )


@report_router.post("/list", response_model=ReportListResponse)
async def list_report(
    request: ReportListRequest,
    service: Annotated[ReportService, Depends(get_report_service_by_type)],
):
    """List paginated report.

    Args:
        request: Report generation request.
        service: Resolved report service.

    Returns:
        ReportListResponse: Report list response.
    """
    cache_key, total, data = await service.get_paginated_report(
        request.report_type,
        request.filters,
        request.limit,
        request.offset,
    )
    return ReportListResponse(
        cache_key=cache_key,
        total=total,
        limit=request.limit,
        offset=request.offset,
        data=data,
    )


@report_router.post("/download")
async def download_report(
    request: ReportGenerateRequest,
    service: Annotated[ReportService, Depends(get_report_service_by_type)],
):
    """
    Download a report in Excel format.

    Args:
        request: Report generation request.
        service: Resolved report service.

    Returns:
        Response: Report download response.
    """
    excel_bytes = await service.download_excel(request.report_type, request.filters)

    filename = REPORT_FILENAMES.get(request.report_type, "relatorio.xlsx")
    headers = {"Content-Disposition": f"attachment; filename={filename}"}

    return Response(
        content=excel_bytes.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

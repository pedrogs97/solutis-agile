"""Router module for report API endpoints"""

from typing import Annotated

from api.v1.depends.report import get_report_service
from core.errors.exceptions import ReportException
from fastapi import APIRouter, Depends, Response, status
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
    service: Annotated[ReportService, Depends(get_report_service)],
):
    """Generate a report and store it in cache.

    Args:
        request: Report generation request.
        service: Report service.

    Returns:
        ReportGenerateResponse: Report generation response.
    """
    if request.report_type != "supplier_evaluation":
        raise ReportException(
            "Tipo de relatório não suportado", status.HTTP_400_BAD_REQUEST
        )

    cache_key, total = await service.generate_report(
        request.report_type, request.filters
    )
    return ReportGenerateResponse(
        cache_key=cache_key, total=total, message="Relatório gerado com sucesso"
    )


@report_router.post("/list", response_model=ReportListResponse)
async def list_report(
    request: ReportListRequest,
    service: Annotated[ReportService, Depends(get_report_service)],
):
    """List paginated report.

    Args:
        request: Report generation request.
        service: Report service.

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
    service: Annotated[ReportService, Depends(get_report_service)],
):
    """
    Download a report in Excel format.

    Args:
        request: Report generation request.
        service: Report service.

    Returns:
        Response: Report download response.
    """
    excel_bytes = await service.download_excel(request.report_type, request.filters)

    headers = {
        "Content-Disposition": "attachment; filename=relatorio_fornecedores.xlsx"
    }

    return Response(
        content=excel_bytes.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

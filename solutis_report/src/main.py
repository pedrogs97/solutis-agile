"""Main Service"""

import os
import tracemalloc

from api.v1.routers.report import report_router
from core.config import AppConfig
from core.logging import setup_logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from loguru import logger

config = AppConfig()
setup_logger()

tracemalloc.start()
if not os.path.exists(f"{config.BASE_DIR}/logs/"):
    os.makedirs(f"{config.BASE_DIR}/logs/")


app = FastAPI(
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.exception(f"Erro inesperado no servidor: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno ao processar a requisição."},
    )


@app.get("/", tags=["Service"])
def root():
    """Redirect to docs"""
    return RedirectResponse(url="/docs")

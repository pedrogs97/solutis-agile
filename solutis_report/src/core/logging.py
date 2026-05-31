"""Loguru log configuration."""

import sys

from core.config import AppConfig
from loguru import logger

_settings = AppConfig()


def setup_logger() -> None:
    """Setup loguru"""
    logger.remove()  # Remove handler padrão

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    logger.add(
        sys.stdout,
        level=_settings.LOG_LEVEL,
        format=log_format,
    )

    logger.add(
        f"{_settings.BASE_DIR}/logs/{{time:YYYY-MM-DD}}.log",
        rotation="00:00",  # Rotaciona à meia-noite
        retention="30 days",  # Mantém logs por 30 dias
        level=_settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        diagnose=True,
    )

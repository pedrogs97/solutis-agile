"""
Core configuration for the application
"""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    """Application Configuration"""

    DEBUG: bool = True
    SECRET_KEY: str = "default_secret"
    ORIGINS: List[str] = ["*"]
    VERSION: str = "1.0.0"
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost/db"
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    LOG_LEVEL: str = "DEBUG" if DEBUG else "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

import os
from pydantic_settings import BaseSettings


class Settings:
    PROJECT_NAME: str = "Solutis Flow Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./flow.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    TEST_MODE: bool = os.getenv("TEST_MODE", "false").lower() == "true"


settings = Settings()

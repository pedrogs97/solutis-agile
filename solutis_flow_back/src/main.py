from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.api.v1 import api_v1_router
from src.config import settings
from src.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Solutis Flow Backend...")
    init_db()
    yield
    logger.info("Shutting down Solutis Flow Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "solutis-flow-back"}

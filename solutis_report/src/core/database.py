"""Database configuration"""

from collections.abc import AsyncGenerator

from core.config import AppConfig
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

config = AppConfig()


class DatabaseSessionFactory:
    """Factory to manage database sessions for different databases."""

    def __init__(self) -> None:
        self._procurement_engine = create_async_engine(
            config.DATABASE_URL_PROCUREMENT,
            echo=config.DEBUG,
            future=True,
            pool_pre_ping=True,
        )
        # pyrefly: ignore [no-matching-overload]
        self._procurement_session_maker = sessionmaker(
            self._procurement_engine, class_=AsyncSession, expire_on_commit=False
        )

        self._adm_engine = create_async_engine(
            config.DATABASE_ADM_URL,
            echo=config.DEBUG,
            future=True,
            pool_pre_ping=True,
        )
        # pyrefly: ignore [no-matching-overload]
        self._adm_session_maker = sessionmaker(
            self._adm_engine, class_=AsyncSession, expire_on_commit=False
        )

    def get_session_maker(self, db_name: str):
        """Get the session maker by name."""
        if db_name == "adm":
            return self._adm_session_maker
        return self._procurement_session_maker


db_factory = DatabaseSessionFactory()


async def get_procurement_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async generator for procurement database sessions.

    Yields:
        AsyncSession: Async database session.
    """
    session_maker = db_factory.get_session_maker("procurement")
    async with session_maker() as session:
        yield session


async def get_adm_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async generator for admin database sessions.

    Yields:
        AsyncSession: Async database session.
    """
    session_maker = db_factory.get_session_maker("adm")
    async with session_maker() as session:
        yield session


# Module-level variables for backward compatibility
engine = db_factory._procurement_engine
async_session_maker = db_factory._procurement_session_maker
get_session = get_adm_session

"""Tests for DatabaseSessionFactory and database session helper generators"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from core.database import (
    DatabaseSessionFactory,
    get_adm_session,
    get_procurement_session,
    get_session,
)
from sqlmodel.ext.asyncio.session import AsyncSession


def test_database_factory_initialization():
    """Test that DatabaseSessionFactory initializes correctly with two different session makers."""
    factory = DatabaseSessionFactory()
    assert factory._procurement_session_maker is not None
    assert factory._adm_session_maker is not None

    # Verify they are separate sessionmaker instances
    assert factory._procurement_session_maker is not factory._adm_session_maker


def test_database_factory_get_session_maker():
    """Test get_session_maker retrieves the correct maker based on key."""
    factory = DatabaseSessionFactory()
    adm_maker = factory.get_session_maker("adm")
    procurement_maker = factory.get_session_maker("procurement")
    default_maker = factory.get_session_maker("unknown")

    assert adm_maker is factory._adm_session_maker
    assert procurement_maker is factory._procurement_session_maker
    # Default should fallback to procurement
    assert default_maker is factory._procurement_session_maker


@pytest.mark.asyncio
async def test_get_procurement_session():
    """Test get_procurement_session yields session from the factory procurement maker."""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_maker = MagicMock()
    # Mock the async context manager behavior of session maker
    mock_maker.return_value.__aenter__.return_value = mock_session
    mock_maker.return_value.__aexit__.return_value = None

    with patch(
        "core.database.db_factory.get_session_maker", return_value=mock_maker
    ) as mock_get_maker:
        generator = get_procurement_session()
        session = await anext(generator)

        assert session is mock_session
        mock_get_maker.assert_called_once_with("procurement")
        mock_maker.assert_called_once()


@pytest.mark.asyncio
async def test_get_adm_session():
    """Test get_adm_session yields session from the factory adm maker."""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_maker = MagicMock()
    mock_maker.return_value.__aenter__.return_value = mock_session
    mock_maker.return_value.__aexit__.return_value = None

    with patch(
        "core.database.db_factory.get_session_maker", return_value=mock_maker
    ) as mock_get_maker:
        generator = get_adm_session()
        session = await anext(generator)

        assert session is mock_session
        mock_get_maker.assert_called_once_with("adm")
        mock_maker.assert_called_once()


@pytest.mark.asyncio
async def test_get_session_fallback():
    """Test that get_session works and delegates to the adm session."""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_maker = MagicMock()
    mock_maker.return_value.__aenter__.return_value = mock_session
    mock_maker.return_value.__aexit__.return_value = None

    with patch(
        "core.database.db_factory.get_session_maker", return_value=mock_maker
    ) as mock_get_maker:
        generator = get_session()
        session = await anext(generator)

        assert session is mock_session
        mock_get_maker.assert_called_once_with("adm")

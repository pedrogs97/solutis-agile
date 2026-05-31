"""Cache module"""

import hashlib
import json
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CacheEntry(BaseModel):
    """Cache entry."""

    data: List[Dict[str, Any]]
    expires_at: datetime


class AbstractCache(ABC):
    """Abstract cache interface"""

    @abstractmethod
    def get(
        self, report_type: str, filters: BaseModel
    ) -> Optional[List[Dict[str, Any]]]:
        """Retrieve data from cache."""

    @abstractmethod
    def set(
        self, report_type: str, filters: BaseModel, data: List[Dict[str, Any]]
    ) -> str:
        """Store data in cache and return the key."""

    @abstractmethod
    def generate_key(self, report_type: str, filters: BaseModel) -> str:
        """Generate cache key."""

    @abstractmethod
    def clear_all(self) -> None:
        """Clear all entries from cache."""


class InMemoryReportCache(AbstractCache):
    """In-memory cache implementation."""

    def __init__(self, ttl_hours: int = 1):
        self._cache_store: Dict[str, CacheEntry] = {}
        self.ttl_hours = ttl_hours

    def generate_key(self, report_type: str, filters: BaseModel) -> str:
        """Generate md5 hash from report_type + ordered filters."""
        filters_str = json.dumps(
            filters.model_dump(exclude_none=True, mode="json"),
            sort_keys=True,
            ensure_ascii=False,
        )
        raw_key = f"{report_type}:{filters_str}"
        return hashlib.md5(raw_key.encode("utf-8")).hexdigest()

    def set(
        self, report_type: str, filters: BaseModel, data: List[Dict[str, Any]]
    ) -> str:
        """Stores data and returns the cache_key."""
        self._cleanup_expired()
        cache_key = self.generate_key(report_type, filters)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=self.ttl_hours)
        self._cache_store[cache_key] = CacheEntry(data=data, expires_at=expires_at)
        return cache_key

    def get(
        self, report_type: str, filters: BaseModel
    ) -> Optional[List[Dict[str, Any]]]:
        """Returns data or None if expired/missing."""
        self._cleanup_expired()
        cache_key = self.generate_key(report_type, filters)

        entry = self._cache_store.get(cache_key)
        if entry:
            return entry.data
        return None

    def _cleanup_expired(self) -> None:
        """Removes expired TTL entries."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, entry in self._cache_store.items() if entry.expires_at <= now
        ]
        for key in expired_keys:
            del self._cache_store[key]

    def clear_all(self) -> None:
        """Clears all cache"""
        self._cache_store.clear()

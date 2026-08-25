import asyncio
from typing import Dict, Set
from loguru import logger


class SSEManager:
    def __init__(self):
        # Maps user_id -> Set of asyncio.Queue instances for active SSE clients
        self._user_connections: Dict[int, Set[asyncio.Queue]] = {}

    def connect(self, user_id: int) -> asyncio.Queue:
        queue = asyncio.Queue()
        if user_id not in self._user_connections:
            self._user_connections[user_id] = set()
        self._user_connections[user_id].add(queue)
        logger.info(f"User {user_id} connected to SSE stream. Active queues: {len(self._user_connections[user_id])}")
        return queue

    def disconnect(self, user_id: int, queue: asyncio.Queue):
        if user_id in self._user_connections:
            self._user_connections[user_id].discard(queue)
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]
        logger.info(f"User {user_id} disconnected from SSE stream.")

    def publish_to_user(self, user_id: int, event_data: dict):
        """Send event data to all active SSE connection queues of a specific user."""
        if user_id in self._user_connections:
            for queue in list(self._user_connections[user_id]):
                try:
                    queue.put_nowait(event_data)
                except Exception as e:
                    logger.warning(f"Error publishing to SSE queue for user {user_id}: {e}")


sse_manager = SSEManager()

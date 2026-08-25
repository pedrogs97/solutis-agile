import json
import asyncio
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from src.security import AuthenticatedUser, get_current_user
from src.events.sse_manager import sse_manager

events_router = APIRouter(prefix="/events", tags=["events"])


@events_router.get("/stream", response_class=EventSourceResponse)
async def event_stream(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Server-Sent Events (SSE) stream endpoint.
    Delivers real-time updates to the solutis-flow client filtered for the logged-in user.
    """
    queue = sse_manager.connect(current_user.id)

    async def event_generator():
        try:
            # Send initial ping event
            yield {
                "event": "connected",
                "data": json.dumps({"message": f"Conectado ao fluxo de eventos do usuário {current_user.id}"}),
            }

            while True:
                if await request.is_disconnected():
                    break

                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {
                        "event": "domain_event",
                        "data": json.dumps(event_data),
                    }
                except asyncio.TimeoutError:
                    # Keepalive ping
                    yield {"event": "ping", "data": "keepalive"}

        finally:
            sse_manager.disconnect(current_user.id, queue)

    return EventSourceResponse(event_generator())

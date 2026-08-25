from typing import List, Optional
import dramatiq
from loguru import logger
from src.events.broker import broker
from src.events.sse_manager import sse_manager


@dramatiq.actor(broker=broker)
def process_domain_event_actor(
    event_type: str,
    demand_id: int,
    title: str,
    status: str,
    allowed_user_ids: List[int],
    message: Optional[str] = None,
):
    """
    Dramatiq actor processing domain events.
    Verifies user permission list and dispatches event to authorized user SSE streams.
    """
    logger.info(
        f"Processing Dramatiq event '{event_type}' for demand {demand_id}. Target users: {allowed_user_ids}"
    )

    event_payload = {
        "event_type": event_type,
        "demand_id": demand_id,
        "title": title,
        "status": status,
        "message": message or f"Evento '{event_type}' processado para a demanda #{demand_id}",
    }

    # Dispatch only to authorized users
    for user_id in set(allowed_user_ids):
        sse_manager.publish_to_user(user_id, event_payload)

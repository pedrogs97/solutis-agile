import pytest
from src.events.actors import process_domain_event_actor
from src.events.sse_manager import sse_manager


def test_dramatiq_event_actor_dispatches_to_authorized_sse_user():
    user_id = 100
    queue = sse_manager.connect(user_id)

    # Trigger Dramatiq actor directly
    process_domain_event_actor(
        event_type="StatusUpdated",
        demand_id=5,
        title="Teste Evento Dramatiq",
        status="CONCLUIDO",
        allowed_user_ids=[100, 200],
        message="Demanda concluída",
    )

    # Verify event was put into user 100's SSE queue
    assert not queue.empty()
    event_data = queue.get_nowait()
    assert event_data["event_type"] == "StatusUpdated"
    assert event_data["demand_id"] == 5
    assert event_data["status"] == "CONCLUIDO"

    sse_manager.disconnect(user_id, queue)

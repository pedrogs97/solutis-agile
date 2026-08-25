"""
Dramatiq worker entrypoint for solutis_flow_back.
Run with: uv run dramatiq src.worker
"""

from src.events.broker import broker
from src.events.actors import process_domain_event_actor

__all__ = ["broker", "process_domain_event_actor"]

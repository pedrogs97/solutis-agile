import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.brokers.stub import StubBroker
from src.config import settings

if settings.TEST_MODE or "sqlite" in settings.DATABASE_URL:
    broker = StubBroker()
else:
    try:
        broker = RedisBroker(url=settings.REDIS_URL)
    except Exception:
        broker = StubBroker()

dramatiq.set_broker(broker)

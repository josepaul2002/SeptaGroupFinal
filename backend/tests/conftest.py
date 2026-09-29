import os, sys
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'septa_test')
os.environ.setdefault('APP_ENV', 'development')
os.environ.setdefault('SITE_URL', 'http://testserver')
os.environ.setdefault('CORS_ORIGINS', 'http://testserver')
import motor.motor_asyncio
from mongomock_motor import AsyncMongoMockClient
import pytest
motor.motor_asyncio.AsyncIOMotorClient = AsyncMongoMockClient
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


@pytest.fixture(autouse=True)
def reset_rate_limiter_between_tests():
    """Keep shared in-memory rate-limit counters from leaking across tests."""
    yield
    try:
        import server
        server.limiter.reset()
    except (ImportError, AttributeError):
        pass

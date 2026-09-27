import os, sys
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'septa_test')
os.environ.setdefault('APP_ENV', 'development')
os.environ.setdefault('SITE_URL', 'http://testserver')
os.environ.setdefault('CORS_ORIGINS', 'http://testserver')
import motor.motor_asyncio
from mongomock_motor import AsyncMongoMockClient
motor.motor_asyncio.AsyncIOMotorClient = AsyncMongoMockClient
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

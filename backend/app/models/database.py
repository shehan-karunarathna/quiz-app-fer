import certifi
from pymongo import MongoClient
from app.core.config import settings

def get_db():
    client = MongoClient(
        settings.MONGODB_URI.get_secret_value(),  # Retrieve MongoDB URI from settings
      
        connectTimeoutMS=5000,  # Connection timeout in ms
        serverSelectionTimeoutMS=5000  # Timeout for server selection
    )
    # Test the connection to MongoDB
    client.admin.command('ping')
    return client[settings.DATABASE_NAME]  # Return the database specified in settings

db = get_db()  # Initialize the database connection

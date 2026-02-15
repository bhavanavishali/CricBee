# app/core/redis_config.py
import redis
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class RedisClient:
    _instance: Optional[redis.Redis] = None
    
    @classmethod
    def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            cls._instance = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                
                decode_responses=True  
            )
        return cls._instance
    
    @classmethod
    def close(cls):
        if cls._instance:
            cls._instance.close()
            cls._instance = None

def get_redis() -> redis.Redis:
    return RedisClient.get_client()
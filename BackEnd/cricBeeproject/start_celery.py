#!/usr/bin/env python3
"""
Script to start Celery worker with Redis backend
"""
import os
import sys
import subprocess

def check_redis():
    """Check if Redis is running"""
    try:
        import redis
        from app.core.config import settings
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=settings.redis_db)
        r.ping()
        print("✅ Redis is running")
        return True
    except Exception as e:
        print(f"❌ Redis is not running: {e}")
        print("Please start Redis server first:")
        print("  - On Windows: redis-server")
        print("  - Or install Redis and start it")
        return False

def start_celery():
    """Start Celery worker"""
    print("🚀 Starting Celery worker...")
    
    # Set environment variable for Celery config
    os.environ["CELERY_CONFIG_MODULE"] = "celeryconfig"
    
    # Start Celery worker
    cmd = [
        sys.executable, "-m", "celery",
        "-A", "app.core.celery_app",
        "worker",
        "--loglevel=info",
        "--pool=solo",  # Better for Windows
        "--concurrency=1"
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Celery worker stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start Celery: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if check_redis():
        start_celery()
    else:
        sys.exit(1)

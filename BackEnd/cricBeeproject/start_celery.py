
import os
import sys
import subprocess

def check_redis():
    
    try:
        import redis
        from app.core.config import settings
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=settings.redis_db)
        r.ping()
        
        return True
    except Exception as e:
        
        return False

def start_celery():
    
    
   
    os.environ["CELERY_CONFIG_MODULE"] = "celeryconfig"
    
    
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
        print("Celery worker stopped")
    except subprocess.CalledProcessError as e:
        print(f"Failed to start Celery: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if check_redis():
        start_celery()
    else:
        sys.exit(1)

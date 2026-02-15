from celery import Celery
from app.core.config import settings


celery_app = Celery(
    "cricbee",
    broker_url=f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db}",
    result_backend=f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db}",
    broker_transport_options={
        'visibility_timeout': 3600,
        'socket_keepalive': True,
    },
    result_backend_transport_options={
        'socket_keepalive': True,
    },
    include=["app.tasks.notification_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_max_tasks_per_child=1000,
    
    # Ensure Redis is used
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    
    # Windows-specific settings
    worker_pool="solo",
    worker_concurrency=1,
    
    # Disable prefetch for better reliability
    worker_prefetch_multiplier=1,
)

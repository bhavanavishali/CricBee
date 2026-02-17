# Celery Configuration File
from app.core.config import settings

# Broker settings
broker_url = f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db}"
result_backend = f"redis://{settings.redis_host}:{settings.redis_port}/{settings.redis_db}"

# Task settings
task_serializer = "json"
accept_content = ["json"]
result_serializer = "json"
timezone = "UTC"
enable_utc = True

# Worker settings (optimized for Windows)
worker_pool = "solo"
worker_concurrency = 1
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000

# Task settings
task_track_started = True
task_time_limit = 30 * 60  # 30 minutes
task_soft_time_limit = 25 * 60  # 25 minutes

# Include tasks
include = ["app.tasks.notification_tasks"]

# Result backend settings
result_expires = 3600  # 1 hour
result_backend_transport_options = {
    'master_name': 'mymaster',
}

# Beat schedule (if you need periodic tasks)
beat_schedule = {
    # Add periodic tasks here if needed
}

# Logging
worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s] %(message)s'
worker_task_log_format = '[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s'

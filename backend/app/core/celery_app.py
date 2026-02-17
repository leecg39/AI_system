# @TASK P0-T0.3 - Celery worker configuration
# @SPEC docs/planning/02-trd.md#celery-config
"""Celery application configuration."""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "app.workers.*": {"queue": "default"},
    },
)

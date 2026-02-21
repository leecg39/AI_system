# @TASK P0-T0.3 - API v1 router aggregation
# @SPEC docs/planning/02-trd.md#api-routing
"""API v1 router that aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1 import (
    agents,
    auth,
    dashboard,
    notifications,
    task_logs,
    task_results,
    tasks,
    teams,
    templates,
    users,
)

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(teams.router)
api_v1_router.include_router(tasks.router)
api_v1_router.include_router(task_results.router)
api_v1_router.include_router(task_logs.router)
api_v1_router.include_router(templates.router)
api_v1_router.include_router(agents.router)
api_v1_router.include_router(notifications.router)

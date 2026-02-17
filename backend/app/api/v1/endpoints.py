# @TASK P0-T0.3 - API v1 router aggregation
# @SPEC docs/planning/02-trd.md#api-routing
"""API v1 router that aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1 import auth, users

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)

# @TASK P2-R4-T1 - Dashboard API endpoints
# @SPEC docs/planning/02-trd.md#dashboard-stats
"""Dashboard endpoints for aggregated statistics."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStatsResponse:
    """Get dashboard statistics for the authenticated user.

    Returns counts of running tasks, completed tasks today,
    and total teams owned by the user.
    """
    return await get_dashboard_stats(db, current_user.id)

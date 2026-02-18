# @TASK P2-R4-T1 - Dashboard stats service
# @SPEC docs/planning/02-trd.md#dashboard-stats
"""Dashboard service for aggregating user statistics."""
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.team import Team
from app.schemas.dashboard import DashboardStatsResponse


async def get_dashboard_stats(
    db: AsyncSession, user_id: str
) -> DashboardStatsResponse:
    """Compute dashboard statistics for the given user.

    Aggregates:
    - running_tasks: Tasks with status 'running' in user's teams
    - completed_tasks_today: Tasks with status 'completed' created today in user's teams
    - total_teams: Count of teams owned by the user

    Args:
        db: Async database session.
        user_id: ID of the authenticated user.

    Returns:
        DashboardStatsResponse with the computed counts.
    """
    # Subquery: IDs of teams owned by this user
    user_team_ids = select(Team.id).where(Team.user_id == user_id).subquery()

    # Count running tasks across user's teams
    running_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.team_id.in_(select(user_team_ids.c.id)),
            Task.status == "running",
        )
    )
    running_tasks = running_result.scalar() or 0

    # Count completed tasks created today across user's teams
    today_start = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    completed_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.team_id.in_(select(user_team_ids.c.id)),
            Task.status == "completed",
            Task.created_at >= today_start,
        )
    )
    completed_tasks_today = completed_result.scalar() or 0

    # Count total teams owned by the user
    teams_result = await db.execute(
        select(func.count(Team.id)).where(Team.user_id == user_id)
    )
    total_teams = teams_result.scalar() or 0

    return DashboardStatsResponse(
        running_tasks=running_tasks,
        completed_tasks_today=completed_tasks_today,
        total_teams=total_teams,
    )

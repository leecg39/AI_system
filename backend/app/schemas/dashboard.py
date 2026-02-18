# @TASK P2-R4-T1 - Dashboard stats response schema
# @SPEC docs/planning/02-trd.md#dashboard-stats
"""Dashboard schemas for stats and summary data."""
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Response schema for GET /api/v1/dashboard/stats.

    Attributes:
        running_tasks: Number of tasks currently in 'running' status
            across all teams owned by the authenticated user.
        completed_tasks_today: Number of tasks with 'completed' status
            created today, across all teams owned by the user.
        total_teams: Total number of teams owned by the user.
    """
    running_tasks: int
    completed_tasks_today: int
    total_teams: int

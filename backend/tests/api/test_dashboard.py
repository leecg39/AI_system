# @TASK P2-R4-T1 - Dashboard Stats API TDD tests
# @SPEC docs/planning/02-trd.md#dashboard-stats
# @TEST tests/api/test_dashboard.py
"""Tests for dashboard stats endpoint.

Follows RED -> GREEN -> REFACTOR TDD cycle.
"""
import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.models.task import Task


# ---------------------------------------------------------------------------
# Fixtures: teams and tasks scoped to the test user
# ---------------------------------------------------------------------------

@pytest.fixture
async def test_team(db_session: AsyncSession, test_user) -> Team:
    """Create a single team owned by the test user."""
    team = Team(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Test Team Alpha",
        description="First test team",
        config={},
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team


@pytest.fixture
async def test_teams(db_session: AsyncSession, test_user) -> list:
    """Create multiple teams owned by the test user."""
    teams = []
    for i in range(3):
        team = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name=f"Test Team {i}",
            description=f"Test team number {i}",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(team)
        teams.append(team)
    await db_session.commit()
    for team in teams:
        await db_session.refresh(team)
    return teams


@pytest.fixture
async def test_tasks_with_data(
    db_session: AsyncSession, test_user, test_teams
) -> list:
    """Create tasks in various states across the test user's teams.

    Creates:
    - 2 running tasks (team 0, team 1)
    - 1 completed task today (team 0)
    - 1 completed task yesterday (team 1) -- should NOT count
    - 1 pending task (team 2)
    """
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)

    tasks_data = [
        # Running tasks
        {
            "team_id": test_teams[0].id,
            "status": "running",
            "created_at": now,
        },
        {
            "team_id": test_teams[1].id,
            "status": "running",
            "created_at": now,
        },
        # Completed today
        {
            "team_id": test_teams[0].id,
            "status": "completed",
            "created_at": now,
        },
        # Completed yesterday (should NOT count in completed_tasks_today)
        {
            "team_id": test_teams[1].id,
            "status": "completed",
            "created_at": yesterday,
        },
        # Pending task
        {
            "team_id": test_teams[2].id,
            "status": "pending",
            "created_at": now,
        },
    ]

    tasks = []
    for td in tasks_data:
        task = Task(
            id=str(uuid.uuid4()),
            team_id=td["team_id"],
            user_id=test_user.id,
            type="test_task",
            input={},
            options={},
            status=td["status"],
            progress=0,
            created_at=td["created_at"],
        )
        db_session.add(task)
        tasks.append(task)

    await db_session.commit()
    for task in tasks:
        await db_session.refresh(task)
    return tasks


# ---------------------------------------------------------------------------
# GET /api/v1/dashboard/stats
# ---------------------------------------------------------------------------

class TestDashboardStats:
    """Tests for GET /api/v1/dashboard/stats."""

    @pytest.mark.anyio
    async def test_dashboard_stats_unauthenticated(self, client):
        """Request without token returns 401."""
        response = await client.get("/api/v1/dashboard/stats")
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_dashboard_stats_empty(self, client, test_user, auth_headers):
        """Authenticated user with no teams/tasks gets all zeros."""
        response = await client.get(
            "/api/v1/dashboard/stats", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["running_tasks"] == 0
        assert data["completed_tasks_today"] == 0
        assert data["total_teams"] == 0

    @pytest.mark.anyio
    async def test_dashboard_stats_with_data(
        self, client, test_user, auth_headers, test_teams, test_tasks_with_data
    ):
        """Authenticated user with teams and tasks gets correct counts."""
        response = await client.get(
            "/api/v1/dashboard/stats", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["running_tasks"] == 2
        assert data["completed_tasks_today"] == 1
        assert data["total_teams"] == 3

    @pytest.mark.anyio
    async def test_dashboard_stats_only_own_teams(
        self, client, db_session, test_user, auth_headers, test_team
    ):
        """Stats only count teams/tasks owned by the authenticated user.

        Another user's teams and tasks must not appear in the stats.
        """
        # Create another user's team and running task
        other_user_id = str(uuid.uuid4())
        from app.models.user import User
        from app.core.security import get_password_hash

        other_user = User(
            id=other_user_id,
            email="other@example.com",
            password_hash=get_password_hash("otherpassword"),
            name="Other User",
            plan="free",
            api_usage_count=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(other_user)

        other_team = Team(
            id=str(uuid.uuid4()),
            user_id=other_user_id,
            name="Other Team",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(other_team)

        other_task = Task(
            id=str(uuid.uuid4()),
            team_id=other_team.id,
            user_id=other_user_id,
            type="other_task",
            input={},
            options={},
            status="running",
            progress=0,
            created_at=datetime.utcnow(),
        )
        db_session.add(other_task)
        await db_session.commit()

        # Current user should only see their own team (1), no running tasks
        response = await client.get(
            "/api/v1/dashboard/stats", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["running_tasks"] == 0
        assert data["completed_tasks_today"] == 0
        assert data["total_teams"] == 1  # only test_team

    @pytest.mark.anyio
    async def test_dashboard_stats_response_schema(
        self, client, test_user, auth_headers
    ):
        """Response contains exactly the expected fields."""
        response = await client.get(
            "/api/v1/dashboard/stats", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        expected_keys = {"running_tasks", "completed_tasks_today", "total_teams"}
        assert set(data.keys()) == expected_keys

# @TASK P2-R1-T1 - Teams API TDD tests
# @SPEC docs/planning/02-trd.md#teams-api
# @TEST tests/api/test_teams.py
"""Tests for Teams CRUD endpoints.

Follows RED -> GREEN -> REFACTOR TDD cycle.
Covers: create, list, get, update, delete with auth & ownership checks.
"""
import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.team import Team
from app.models.agent import Agent
from app.models.task import Task


# ---------------------------------------------------------------------------
# Helper fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def other_user(db_session: AsyncSession) -> User:
    """Create a second user for ownership / isolation tests."""
    user = User(
        id=str(uuid.uuid4()),
        email="other@example.com",
        password_hash=get_password_hash("otherpassword123"),
        name="Other User",
        plan="free",
        api_usage_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def other_auth_headers(other_user: User) -> dict:
    """Authorization headers for other_user."""
    token = create_access_token(subject=other_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def sample_team(db_session: AsyncSession, test_user: User) -> Team:
    """Create a sample team owned by test_user."""
    team = Team(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="My Team",
        description="A test team",
        config={"key": "value"},
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team


@pytest.fixture
async def other_user_team(db_session: AsyncSession, other_user: User) -> Team:
    """Create a team owned by other_user."""
    team = Team(
        id=str(uuid.uuid4()),
        user_id=other_user.id,
        name="Other Team",
        description="Belongs to other user",
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
async def team_with_agents(
    db_session: AsyncSession, sample_team: Team
) -> Team:
    """Add 3 agents to sample_team and return it."""
    for i in range(3):
        agent = Agent(
            id=str(uuid.uuid4()),
            team_id=sample_team.id,
            name=f"Agent {i}",
            role="worker",
            layer="execution",
            model="sonnet",
            tools=[],
            sort_order=i,
            status="idle",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(agent)
    await db_session.commit()
    return sample_team


@pytest.fixture
async def team_with_recent_tasks(
    db_session: AsyncSession, sample_team: Team, test_user: User
) -> Team:
    """Add tasks to sample_team: 2 recent (within 24h), 1 old."""
    now = datetime.utcnow()
    # 2 recent tasks
    for i in range(2):
        task = Task(
            id=str(uuid.uuid4()),
            team_id=sample_team.id,
            user_id=test_user.id,
            type="test_task",
            input={},
            options={},
            status="completed",
            progress=100,
            created_at=now - timedelta(hours=i + 1),
        )
        db_session.add(task)
    # 1 old task (older than 24h)
    old_task = Task(
        id=str(uuid.uuid4()),
        team_id=sample_team.id,
        user_id=test_user.id,
        type="old_task",
        input={},
        options={},
        status="completed",
        progress=100,
        created_at=now - timedelta(hours=48),
    )
    db_session.add(old_task)
    await db_session.commit()
    return sample_team


# ---------------------------------------------------------------------------
# POST /api/v1/teams  (Create Team)
# ---------------------------------------------------------------------------

class TestCreateTeam:
    """Tests for POST /api/v1/teams."""

    @pytest.mark.anyio
    async def test_create_team_success(self, client, test_user, auth_headers):
        """Create team with valid data returns 201 and TeamResponse."""
        payload = {
            "name": "New Team",
            "description": "A brand new team",
            "config": {"model": "opus"},
        }
        response = await client.post(
            "/api/v1/teams", json=payload, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Team"
        assert data["description"] == "A brand new team"
        assert data["config"] == {"model": "opus"}
        assert data["user_id"] == test_user.id
        assert data["status"] == "active"
        assert data["agent_count"] == 0
        assert data["recent_task_count"] == 0
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.anyio
    async def test_create_team_minimal(self, client, test_user, auth_headers):
        """Create team with only required field (name) returns 201."""
        payload = {"name": "Minimal Team"}
        response = await client.post(
            "/api/v1/teams", json=payload, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Team"
        assert data["description"] is None
        assert data["config"] == {}
        assert data["template_id"] is None

    @pytest.mark.anyio
    async def test_create_team_unauthenticated(self, client):
        """Create team without auth token returns 401."""
        payload = {"name": "No Auth Team"}
        response = await client.post("/api/v1/teams", json=payload)

        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_create_team_missing_name(self, client, auth_headers):
        """Create team without name returns 422."""
        payload = {"description": "No name provided"}
        response = await client.post(
            "/api/v1/teams", json=payload, headers=auth_headers
        )

        assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/v1/teams  (List Teams)
# ---------------------------------------------------------------------------

class TestListTeams:
    """Tests for GET /api/v1/teams."""

    @pytest.mark.anyio
    async def test_list_teams_empty(self, client, test_user, auth_headers):
        """List teams with no teams returns empty list."""
        response = await client.get("/api/v1/teams", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["teams"] == []
        assert data["total"] == 0

    @pytest.mark.anyio
    async def test_list_teams_own_only(
        self, client, test_user, auth_headers, sample_team, other_user_team
    ):
        """List teams returns only the current user's teams."""
        response = await client.get("/api/v1/teams", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["teams"]) == 1
        assert data["teams"][0]["id"] == sample_team.id
        assert data["teams"][0]["name"] == "My Team"

    @pytest.mark.anyio
    async def test_list_teams_unauthenticated(self, client):
        """List teams without auth returns 401."""
        response = await client.get("/api/v1/teams")

        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_list_teams_with_counts(
        self, client, auth_headers, team_with_agents, team_with_recent_tasks
    ):
        """List teams includes agent_count and recent_task_count."""
        # team_with_agents and team_with_recent_tasks are the same sample_team
        # with agents and tasks added
        response = await client.get("/api/v1/teams", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        team_data = data["teams"][0]
        assert team_data["agent_count"] == 3
        assert team_data["recent_task_count"] == 2


# ---------------------------------------------------------------------------
# GET /api/v1/teams/{team_id}  (Get Team)
# ---------------------------------------------------------------------------

class TestGetTeam:
    """Tests for GET /api/v1/teams/{team_id}."""

    @pytest.mark.anyio
    async def test_get_team_success(
        self, client, auth_headers, sample_team
    ):
        """Get own team returns 200 and TeamResponse."""
        response = await client.get(
            f"/api/v1/teams/{sample_team.id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_team.id
        assert data["name"] == "My Team"
        assert data["description"] == "A test team"
        assert data["agent_count"] == 0
        assert data["recent_task_count"] == 0

    @pytest.mark.anyio
    async def test_get_team_not_found(self, client, auth_headers):
        """Get non-existent team returns 404."""
        fake_id = str(uuid.uuid4())
        response = await client.get(
            f"/api/v1/teams/{fake_id}", headers=auth_headers
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_get_team_other_user_forbidden(
        self, client, auth_headers, other_user_team
    ):
        """Get another user's team returns 403."""
        response = await client.get(
            f"/api/v1/teams/{other_user_team.id}", headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_get_team_unauthenticated(self, client, sample_team):
        """Get team without auth returns 401."""
        response = await client.get(f"/api/v1/teams/{sample_team.id}")

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/v1/teams/{team_id}  (Update Team)
# ---------------------------------------------------------------------------

class TestUpdateTeam:
    """Tests for PUT /api/v1/teams/{team_id}."""

    @pytest.mark.anyio
    async def test_update_team_name(
        self, client, auth_headers, sample_team
    ):
        """Update team name returns 200 with updated data."""
        payload = {"name": "Renamed Team"}
        response = await client.put(
            f"/api/v1/teams/{sample_team.id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Renamed Team"
        # Unchanged fields preserved
        assert data["description"] == "A test team"

    @pytest.mark.anyio
    async def test_update_team_status(
        self, client, auth_headers, sample_team
    ):
        """Update team status to paused."""
        payload = {"status": "paused"}
        response = await client.put(
            f"/api/v1/teams/{sample_team.id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "paused"

    @pytest.mark.anyio
    async def test_update_team_not_found(self, client, auth_headers):
        """Update non-existent team returns 404."""
        fake_id = str(uuid.uuid4())
        payload = {"name": "Ghost Team"}
        response = await client.put(
            f"/api/v1/teams/{fake_id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_update_team_other_user_forbidden(
        self, client, auth_headers, other_user_team
    ):
        """Update another user's team returns 403."""
        payload = {"name": "Hijacked"}
        response = await client.put(
            f"/api/v1/teams/{other_user_team.id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_update_team_invalid_status(
        self, client, auth_headers, sample_team
    ):
        """Update team with invalid status returns 422."""
        payload = {"status": "invalid_status"}
        response = await client.put(
            f"/api/v1/teams/{sample_team.id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 422


# ---------------------------------------------------------------------------
# DELETE /api/v1/teams/{team_id}  (Delete Team)
# ---------------------------------------------------------------------------

class TestDeleteTeam:
    """Tests for DELETE /api/v1/teams/{team_id}."""

    @pytest.mark.anyio
    async def test_delete_team_success(
        self, client, auth_headers, sample_team
    ):
        """Delete own team returns 204."""
        response = await client.delete(
            f"/api/v1/teams/{sample_team.id}", headers=auth_headers
        )

        assert response.status_code == 204

        # Verify it is gone
        get_response = await client.get(
            f"/api/v1/teams/{sample_team.id}", headers=auth_headers
        )
        assert get_response.status_code == 404

    @pytest.mark.anyio
    async def test_delete_team_not_found(self, client, auth_headers):
        """Delete non-existent team returns 404."""
        fake_id = str(uuid.uuid4())
        response = await client.delete(
            f"/api/v1/teams/{fake_id}", headers=auth_headers
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_delete_team_other_user_forbidden(
        self, client, auth_headers, other_user_team
    ):
        """Delete another user's team returns 403."""
        response = await client.delete(
            f"/api/v1/teams/{other_user_team.id}", headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_delete_team_unauthenticated(self, client, sample_team):
        """Delete team without auth returns 401."""
        response = await client.delete(f"/api/v1/teams/{sample_team.id}")

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/v1/teams?search=query  (Search Teams)
# ---------------------------------------------------------------------------

class TestSearchTeams:
    """Tests for GET /api/v1/teams with search parameter."""

    @pytest.mark.anyio
    async def test_search_teams_by_name(
        self, client, auth_headers, db_session, test_user
    ):
        """Search teams by name returns matching results."""
        # Create teams with different names
        team1 = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Marketing Team",
            description="Marketing dept",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        team2 = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Sales Team",
            description="Sales dept",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        team3 = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Development Team",
            description="Dev dept",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add_all([team1, team2, team3])
        await db_session.commit()

        response = await client.get(
            "/api/v1/teams?search=marketing", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["teams"]) == 1
        assert data["teams"][0]["name"] == "Marketing Team"

    @pytest.mark.anyio
    async def test_search_teams_by_description(
        self, client, auth_headers, db_session, test_user
    ):
        """Search teams by description returns matching results."""
        team1 = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Team Alpha",
            description="Customer support team",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        team2 = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Team Beta",
            description="Product development",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add_all([team1, team2])
        await db_session.commit()

        response = await client.get(
            "/api/v1/teams?search=support", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["teams"][0]["name"] == "Team Alpha"

    @pytest.mark.anyio
    async def test_search_teams_case_insensitive(
        self, client, auth_headers, db_session, test_user
    ):
        """Search is case insensitive."""
        team = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Analytics Team",
            description="Data analysis",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(team)
        await db_session.commit()

        response = await client.get(
            "/api/v1/teams?search=ANALYTICS", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["teams"][0]["name"] == "Analytics Team"

    @pytest.mark.anyio
    async def test_search_teams_no_results(
        self, client, auth_headers, db_session, test_user
    ):
        """Search with no matches returns empty list."""
        team = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Engineering Team",
            description="Software engineering",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(team)
        await db_session.commit()

        response = await client.get(
            "/api/v1/teams?search=nonexistent", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["teams"] == []

    @pytest.mark.anyio
    async def test_search_teams_empty_query(
        self, client, auth_headers, db_session, test_user
    ):
        """Search with empty string returns all teams."""
        team = Team(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            name="Test Team",
            description="Test",
            config={},
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db_session.add(team)
        await db_session.commit()

        response = await client.get("/api/v1/teams?search=", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

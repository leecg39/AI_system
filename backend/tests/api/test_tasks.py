import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.task import Task
from app.models.team import Team
from app.models.user import User


@pytest.fixture
async def other_user(db_session: AsyncSession) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email="task-other@example.com",
        password_hash=get_password_hash("otherpassword123"),
        name="Other Task User",
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
async def other_auth_headers(other_user: User) -> dict[str, str]:
    token = create_access_token(subject=other_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def second_team(db_session: AsyncSession, test_user: User) -> Team:
    team = Team(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Second Team",
        description="Second team owned by test user",
        config={"region": "apac"},
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
    team = Team(
        id=str(uuid.uuid4()),
        user_id=other_user.id,
        name="Other User Team",
        description="Owned by other user",
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
async def seeded_tasks(
    db_session: AsyncSession,
    test_user: User,
    test_team: Team,
    second_team: Team,
    other_user: User,
    other_user_team: Team,
) -> dict[str, Task]:
    now = datetime.utcnow()

    task_a = Task(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        user_id=test_user.id,
        type="content",
        input={"text": "alpha"},
        options={"tone": "neutral"},
        status="pending",
        progress=0,
        created_at=now - timedelta(hours=2),
    )
    task_b = Task(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        user_id=test_user.id,
        type="analysis",
        input={"url": "https://example.com"},
        options={"depth": "high"},
        status="running",
        progress=45,
        started_at=now - timedelta(hours=1, minutes=10),
        created_at=now - timedelta(hours=1, minutes=15),
    )
    task_c = Task(
        id=str(uuid.uuid4()),
        team_id=second_team.id,
        user_id=test_user.id,
        type="report",
        input={"topic": "market"},
        options={"format": "pdf"},
        status="completed",
        progress=100,
        started_at=now - timedelta(minutes=40),
        completed_at=now - timedelta(minutes=20),
        created_at=now - timedelta(minutes=45),
    )
    task_d = Task(
        id=str(uuid.uuid4()),
        team_id=second_team.id,
        user_id=test_user.id,
        type="analysis",
        input={"dataset": "legacy"},
        options={},
        status="failed",
        progress=80,
        started_at=now - timedelta(days=1, minutes=30),
        completed_at=now - timedelta(days=1),
        created_at=now - timedelta(days=1, hours=1),
    )
    task_other_user = Task(
        id=str(uuid.uuid4()),
        team_id=other_user_team.id,
        user_id=other_user.id,
        type="content",
        input={"text": "other"},
        options={},
        status="running",
        progress=20,
        created_at=now - timedelta(minutes=10),
    )

    db_session.add_all([task_a, task_b, task_c, task_d, task_other_user])
    await db_session.commit()

    for task in [task_a, task_b, task_c, task_d, task_other_user]:
        await db_session.refresh(task)

    return {
        "task_a": task_a,
        "task_b": task_b,
        "task_c": task_c,
        "task_d": task_d,
        "task_other_user": task_other_user,
    }


class TestCreateTask:
    @pytest.mark.anyio
    async def test_create_task_success(self, client, auth_headers, test_team):
        payload = {
            "type": "content",
            "input": {"url": "https://example.com/video"},
            "options": {"tone": "friendly"},
        }
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/tasks",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["team_id"] == test_team.id
        assert data["type"] == "content"
        assert data["input"] == {"url": "https://example.com/video"}
        assert data["options"] == {"tone": "friendly"}
        assert data["status"] == "pending"
        assert data["progress"] == 0
        assert data["team_name"] == test_team.name
        assert data["duration"] is None
        assert "id" in data

    @pytest.mark.anyio
    async def test_create_task_minimal_payload(self, client, auth_headers, test_team):
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/tasks",
            json={"type": "report"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["input"] == {}
        assert data["options"] == {}

    @pytest.mark.anyio
    async def test_create_task_unauthenticated(self, client, test_team):
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/tasks",
            json={"type": "content"},
        )

        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_create_task_team_not_found(self, client, auth_headers):
        response = await client.post(
            "/api/v1/teams/nonexistent-team/tasks",
            json={"type": "content"},
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_create_task_not_team_owner(
        self,
        client,
        auth_headers,
        other_user_team,
    ):
        response = await client.post(
            f"/api/v1/teams/{other_user_team.id}/tasks",
            json={"type": "content"},
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_create_task_validation_error(self, client, auth_headers, test_team):
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/tasks",
            json={"input": {"url": "https://example.com"}},
            headers=auth_headers,
        )

        assert response.status_code == 422


class TestListTasks:
    @pytest.mark.anyio
    async def test_list_tasks_empty(self, client, auth_headers):
        response = await client.get("/api/v1/tasks", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["tasks"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["limit"] == 20

    @pytest.mark.anyio
    async def test_list_tasks_only_current_user(self, client, auth_headers, seeded_tasks):
        response = await client.get("/api/v1/tasks", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 4
        task_ids = {task["id"] for task in data["tasks"]}
        assert seeded_tasks["task_other_user"].id not in task_ids

    @pytest.mark.anyio
    async def test_list_tasks_filter_by_team(
        self,
        client,
        auth_headers,
        seeded_tasks,
        second_team,
    ):
        response = await client.get(
            f"/api/v1/tasks?team_id={second_team.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(task["team_id"] == second_team.id for task in data["tasks"])

    @pytest.mark.anyio
    async def test_list_tasks_filter_by_status(self, client, auth_headers, seeded_tasks):
        response = await client.get(
            "/api/v1/tasks?status=running",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["tasks"][0]["id"] == seeded_tasks["task_b"].id
        assert data["tasks"][0]["status"] == "running"

    @pytest.mark.anyio
    async def test_list_tasks_filter_by_type(self, client, auth_headers, seeded_tasks):
        response = await client.get(
            "/api/v1/tasks?type=analysis",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(task["type"] == "analysis" for task in data["tasks"])

    @pytest.mark.anyio
    async def test_list_tasks_filter_by_created_from(self, client, auth_headers, seeded_tasks):
        created_from = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        response = await client.get(
            f"/api/v1/tasks?created_from={created_from}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        ids = {task["id"] for task in data["tasks"]}
        assert seeded_tasks["task_c"].id in ids
        assert seeded_tasks["task_d"].id not in ids

    @pytest.mark.anyio
    async def test_list_tasks_pagination(self, client, auth_headers, seeded_tasks):
        response = await client.get(
            "/api/v1/tasks?page=2&limit=2",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 4
        assert data["page"] == 2
        assert data["limit"] == 2
        assert len(data["tasks"]) == 2

    @pytest.mark.anyio
    async def test_list_tasks_unauthenticated(self, client):
        response = await client.get("/api/v1/tasks")

        assert response.status_code == 401


class TestGetTask:
    @pytest.mark.anyio
    async def test_get_task_success(self, client, auth_headers, seeded_tasks):
        task_id = seeded_tasks["task_c"].id
        response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["type"] == "report"
        assert data["status"] == "completed"
        assert data["team_name"] == "Second Team"
        assert data["duration"] is not None

    @pytest.mark.anyio
    async def test_get_task_not_found(self, client, auth_headers):
        response = await client.get(
            f"/api/v1/tasks/{str(uuid.uuid4())}",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_get_task_forbidden(self, client, auth_headers, seeded_tasks):
        response = await client.get(
            f"/api/v1/tasks/{seeded_tasks['task_other_user'].id}",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_get_task_unauthenticated(self, client, seeded_tasks):
        response = await client.get(f"/api/v1/tasks/{seeded_tasks['task_a'].id}")

        assert response.status_code == 401


class TestCancelTask:
    @pytest.mark.anyio
    async def test_cancel_pending_task_success(self, client, auth_headers, seeded_tasks):
        task_id = seeded_tasks["task_a"].id
        response = await client.put(
            f"/api/v1/tasks/{task_id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["status"] == "cancelled"
        assert data["completed_at"] is not None

    @pytest.mark.anyio
    async def test_cancel_running_task_success(self, client, auth_headers, seeded_tasks):
        task_id = seeded_tasks["task_b"].id
        response = await client.put(
            f"/api/v1/tasks/{task_id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"

    @pytest.mark.anyio
    async def test_cancel_finished_task_rejected(self, client, auth_headers, seeded_tasks):
        response = await client.put(
            f"/api/v1/tasks/{seeded_tasks['task_c'].id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Task is already finished"

    @pytest.mark.anyio
    async def test_cancel_task_not_found(self, client, auth_headers):
        response = await client.put(
            f"/api/v1/tasks/{str(uuid.uuid4())}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_cancel_task_forbidden(self, client, auth_headers, seeded_tasks):
        response = await client.put(
            f"/api/v1/tasks/{seeded_tasks['task_other_user'].id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_cancel_task_unauthenticated(self, client, seeded_tasks):
        response = await client.put(f"/api/v1/tasks/{seeded_tasks['task_a'].id}/cancel")

        assert response.status_code == 401

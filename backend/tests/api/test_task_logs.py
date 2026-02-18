import uuid
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect

from app.core.security import create_access_token
from app.main import app
from app.models.agent import Agent
from app.models.task import Task
from app.models.task_log import TaskLog


@pytest.fixture
async def log_agent(db_session: AsyncSession, test_team) -> Agent:
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        name="Log Agent",
        role="processor",
        layer="execution",
        model="sonnet",
        tools=[],
        sort_order=0,
        status="running",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def log_task(db_session: AsyncSession, test_user, test_team) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        user_id=test_user.id,
        type="analysis",
        input={"url": "https://example.com"},
        options={"depth": "high"},
        status="running",
        progress=50,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def other_log_agent(db_session: AsyncSession, test_team_other_user) -> Agent:
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=test_team_other_user.id,
        name="Other Log Agent",
        role="processor",
        layer="execution",
        model="sonnet",
        tools=[],
        sort_order=0,
        status="running",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def other_log_task(db_session: AsyncSession, test_team_other_user) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        team_id=test_team_other_user.id,
        user_id=test_team_other_user.user_id,
        type="analysis",
        input={"url": "https://other.example.com"},
        options={},
        status="running",
        progress=25,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def seeded_logs(
    db_session: AsyncSession,
    log_task: Task,
    log_agent: Agent,
    other_log_task: Task,
    other_log_agent: Agent,
) -> dict[str, TaskLog]:
    log_started = TaskLog(
        id=str(uuid.uuid4()),
        task_id=log_task.id,
        agent_id=log_agent.id,
        status="started",
        message="Agent started",
        progress=5,
        created_at=datetime.utcnow(),
    )
    log_processing = TaskLog(
        id=str(uuid.uuid4()),
        task_id=log_task.id,
        agent_id=log_agent.id,
        status="processing",
        message="Working on section 1",
        progress=40,
        created_at=datetime.utcnow(),
    )
    log_other_user = TaskLog(
        id=str(uuid.uuid4()),
        task_id=other_log_task.id,
        agent_id=other_log_agent.id,
        status="processing",
        message="Other user log",
        progress=20,
        created_at=datetime.utcnow(),
    )

    db_session.add_all([log_started, log_processing, log_other_user])
    await db_session.commit()

    for item in [log_started, log_processing, log_other_user]:
        await db_session.refresh(item)

    return {
        "log_started": log_started,
        "log_processing": log_processing,
        "log_other_user": log_other_user,
    }


class TestListTaskLogs:
    @pytest.mark.anyio
    async def test_list_task_logs_success(self, client, auth_headers, log_task, seeded_logs):
        response = await client.get(
            f"/api/v1/tasks/{log_task.id}/logs",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["logs"]) == 2
        assert {item["status"] for item in data["logs"]} == {"started", "processing"}

    @pytest.mark.anyio
    async def test_list_task_logs_task_not_found(self, client, auth_headers):
        response = await client.get(
            f"/api/v1/tasks/{str(uuid.uuid4())}/logs",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_list_task_logs_forbidden(
        self,
        client,
        auth_headers,
        other_log_task,
        seeded_logs,
    ):
        response = await client.get(
            f"/api/v1/tasks/{other_log_task.id}/logs",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_list_task_logs_unauthenticated(self, client, log_task):
        response = await client.get(f"/api/v1/tasks/{log_task.id}/logs")

        assert response.status_code == 401


def test_task_websocket_connect_and_ping() -> None:
    token = create_access_token(subject=str(uuid.uuid4()))
    task_id = str(uuid.uuid4())

    with TestClient(app) as sync_client:
        with sync_client.websocket_connect(f"/ws/tasks/{task_id}?token={token}") as websocket:
            connected = websocket.receive_json()
            assert connected["type"] == "connected"
            assert connected["task_id"] == task_id

            websocket.send_json({"action": "ping"})
            pong = websocket.receive_json()
            assert pong["type"] == "pong"
            assert pong["task_id"] == task_id


def test_task_websocket_requires_token() -> None:
    task_id = str(uuid.uuid4())
    with TestClient(app) as sync_client:
        with pytest.raises(WebSocketDisconnect):
            with sync_client.websocket_connect(f"/ws/tasks/{task_id}"):
                pass


def test_task_websocket_rejects_invalid_token() -> None:
    task_id = str(uuid.uuid4())
    with TestClient(app) as sync_client:
        with pytest.raises(WebSocketDisconnect):
            with sync_client.websocket_connect(f"/ws/tasks/{task_id}?token=invalid"):
                pass


def test_task_websocket_broadcasts_events() -> None:
    token = create_access_token(subject=str(uuid.uuid4()))
    task_id = str(uuid.uuid4())

    with TestClient(app) as sync_client:
        with sync_client.websocket_connect(f"/ws/tasks/{task_id}?token={token}") as ws1:
            with sync_client.websocket_connect(f"/ws/tasks/{task_id}?token={token}") as ws2:
                ws1.receive_json()
                ws2.receive_json()

                ws1.send_json(
                    {
                        "action": "broadcast",
                        "payload": {"status": "processing", "progress": 55},
                    }
                )

                event_1 = ws1.receive_json()
                event_2 = ws2.receive_json()

                assert event_1["type"] == "event"
                assert event_1["task_id"] == task_id
                assert event_1["status"] == "processing"
                assert event_1["progress"] == 55

                assert event_2["type"] == "event"
                assert event_2["task_id"] == task_id
                assert event_2["status"] == "processing"
                assert event_2["progress"] == 55

import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.task import Task
from app.models.task_log import TaskLog
from app.models.task_result import TaskResult
from app.workers.task_worker import execute_task_async


class _FakeAIService:
    def __init__(self, fail_agent_name: Optional[str] = None) -> None:
        self.fail_agent_name = fail_agent_name
        self.calls: list[str] = []

    async def run_agent_prompt(
        self,
        agent_name: str,
        agent_role: str,
        model: Optional[str],
        prompt_template: Optional[str],
        task_type: str,
        input_data: dict[str, object],
        options: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        self.calls.append(agent_name)
        if self.fail_agent_name == agent_name:
            raise RuntimeError(f"{agent_name} failed")
        return {
            "content": f"result from {agent_name}",
            "model": model or "sonnet",
            "usage": {"input_tokens": 10, "output_tokens": 20},
        }


async def _create_agent(
    db_session: AsyncSession,
    team_id: str,
    name: str,
    layer: str,
    sort_order: int,
) -> Agent:
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=team_id,
        name=name,
        role="worker",
        layer=layer,
        model="sonnet",
        prompt_template=None,
        tools=[],
        sort_order=sort_order,
        status="idle",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


async def _create_task(
    db_session: AsyncSession,
    team_id: str,
    user_id: str,
    execution_mode: str = "sequential",
    status: str = "pending",
) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        team_id=team_id,
        user_id=user_id,
        type="analysis",
        input={"text": "hello"},
        options={"execution_mode": execution_mode},
        status=status,
        progress=0,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


def _session_factory(db_session: AsyncSession):
    @asynccontextmanager
    async def _factory():
        yield db_session

    return _factory


@pytest.mark.anyio
async def test_execute_task_async_sequential_success(db_session: AsyncSession, test_user, test_team, monkeypatch):
    await _create_agent(db_session, test_team.id, "orchestrator", "orchestration", 1)
    await _create_agent(db_session, test_team.id, "writer", "execution", 2)
    task = await _create_task(db_session, test_team.id, test_user.id, execution_mode="sequential")

    events: list[dict[str, Any]] = []

    async def _fake_broadcast(task_id: str, payload: dict[str, object]) -> None:
        events.append({"task_id": task_id, "payload": payload})

    import app.workers.task_worker as task_worker_module

    monkeypatch.setattr(task_worker_module.stream_manager, "broadcast", _fake_broadcast)

    result = await execute_task_async(
        task_id=task.id,
        ai_service=_FakeAIService(),
        session_factory=_session_factory(db_session),
    )

    assert result["status"] == "completed"
    assert result["processed_agents"] == 2

    refreshed_task = await db_session.get(Task, task.id)
    assert refreshed_task is not None
    assert refreshed_task.status == "completed"
    assert refreshed_task.progress == 100
    assert refreshed_task.completed_at is not None

    results = (await db_session.execute(select(TaskResult).where(TaskResult.task_id == task.id))).scalars().all()
    assert len(results) == 2

    logs = (await db_session.execute(select(TaskLog).where(TaskLog.task_id == task.id))).scalars().all()
    assert len(logs) == 4
    assert any(log.status == "started" for log in logs)
    assert any(log.status == "completed" for log in logs)

    assert any(item["payload"].get("status") == "completed" for item in events)


@pytest.mark.anyio
async def test_execute_task_async_parallel_success(db_session: AsyncSession, test_user, test_team, monkeypatch):
    await _create_agent(db_session, test_team.id, "writer-a", "execution", 1)
    await _create_agent(db_session, test_team.id, "writer-b", "execution", 2)
    task = await _create_task(db_session, test_team.id, test_user.id, execution_mode="parallel")

    async def _fake_broadcast(task_id: str, payload: dict[str, object]) -> None:
        return None

    import app.workers.task_worker as task_worker_module

    monkeypatch.setattr(task_worker_module.stream_manager, "broadcast", _fake_broadcast)

    result = await execute_task_async(
        task_id=task.id,
        ai_service=_FakeAIService(),
        session_factory=_session_factory(db_session),
    )

    assert result["status"] == "completed"
    assert result["processed_agents"] == 2

    results = (await db_session.execute(select(TaskResult).where(TaskResult.task_id == task.id))).scalars().all()
    assert len(results) == 2


@pytest.mark.anyio
async def test_execute_task_async_marks_failed_on_agent_error(db_session: AsyncSession, test_user, test_team, monkeypatch):
    await _create_agent(db_session, test_team.id, "ok-agent", "execution", 1)
    await _create_agent(db_session, test_team.id, "bad-agent", "execution", 2)
    task = await _create_task(db_session, test_team.id, test_user.id, execution_mode="sequential")

    async def _fake_broadcast(task_id: str, payload: dict[str, object]) -> None:
        return None

    import app.workers.task_worker as task_worker_module

    monkeypatch.setattr(task_worker_module.stream_manager, "broadcast", _fake_broadcast)

    result = await execute_task_async(
        task_id=task.id,
        ai_service=_FakeAIService(fail_agent_name="bad-agent"),
        session_factory=_session_factory(db_session),
    )

    assert result["status"] == "failed"
    refreshed_task = await db_session.get(Task, task.id)
    assert refreshed_task is not None
    assert refreshed_task.status == "failed"
    assert refreshed_task.completed_at is not None

    logs = (await db_session.execute(select(TaskLog).where(TaskLog.task_id == task.id))).scalars().all()
    assert any(log.status == "error" for log in logs)


@pytest.mark.anyio
async def test_execute_task_async_returns_cancelled_for_pre_cancelled_task(
    db_session: AsyncSession,
    test_user,
    test_team,
    monkeypatch,
):
    await _create_agent(db_session, test_team.id, "worker", "execution", 1)
    task = await _create_task(
        db_session,
        test_team.id,
        test_user.id,
        execution_mode="sequential",
        status="cancelled",
    )

    async def _fake_broadcast(task_id: str, payload: dict[str, object]) -> None:
        return None

    import app.workers.task_worker as task_worker_module

    monkeypatch.setattr(task_worker_module.stream_manager, "broadcast", _fake_broadcast)

    result = await execute_task_async(
        task_id=task.id,
        ai_service=_FakeAIService(),
        session_factory=_session_factory(db_session),
    )

    assert result["status"] == "cancelled"


@pytest.mark.anyio
async def test_execute_task_async_returns_not_found_for_missing_task(db_session: AsyncSession):
    result = await execute_task_async(
        task_id=str(uuid.uuid4()),
        ai_service=_FakeAIService(),
        session_factory=_session_factory(db_session),
    )

    assert result["status"] == "not_found"

# @TASK P8-T3 - File upload/download tests
"""Tests for file upload and download functionality."""
import io
import uuid
from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatusEnum
from app.models.team import Team
from app.models.user import User


@pytest.fixture
async def test_task(db_session: AsyncSession, test_user: User, test_team: Team) -> Task:
    """Create and persist a test task."""
    task = Task(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        user_id=test_user.id,
        type="data_analysis",
        input={},
        options={},
        status=TaskStatusEnum.PENDING.value,
        progress=0,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.mark.anyio
async def test_upload_file_success(
    client: AsyncClient,
    auth_headers: dict,
    test_task: Task,
):
    """Test successful file upload to a task."""
    # Create a fake PDF file
    file_content = b"%PDF-1.4\n%Test PDF content"
    file = io.BytesIO(file_content)

    response = await client.post(
        f"/api/v1/tasks/{test_task.id}/upload",
        headers=auth_headers,
        files={"file": ("test.pdf", file, "application/pdf")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["size"] == len(file_content)
    assert "path" in data
    assert test_task.id in data["path"]


@pytest.mark.anyio
async def test_upload_file_too_large(
    client: AsyncClient,
    auth_headers: dict,
    test_task: Task,
):
    """Test file upload fails when file is too large (>10MB)."""
    # Create a file larger than 10MB
    large_content = b"x" * (11 * 1024 * 1024)  # 11MB
    file = io.BytesIO(large_content)

    response = await client.post(
        f"/api/v1/tasks/{test_task.id}/upload",
        headers=auth_headers,
        files={"file": ("large.pdf", file, "application/pdf")},
    )

    assert response.status_code == 422
    assert "too large" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_upload_file_invalid_extension(
    client: AsyncClient,
    auth_headers: dict,
    test_task: Task,
):
    """Test file upload fails with invalid file extension."""
    file_content = b"#!/bin/bash\necho 'test'"
    file = io.BytesIO(file_content)

    response = await client.post(
        f"/api/v1/tasks/{test_task.id}/upload",
        headers=auth_headers,
        files={"file": ("malicious.sh", file, "application/x-sh")},
    )

    assert response.status_code == 422
    assert "not allowed" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_upload_file_unauthorized(
    client: AsyncClient,
    test_task: Task,
):
    """Test file upload fails without authentication."""
    file_content = b"test content"
    file = io.BytesIO(file_content)

    response = await client.post(
        f"/api/v1/tasks/{test_task.id}/upload",
        files={"file": ("test.txt", file, "text/plain")},
    )

    assert response.status_code == 401


@pytest.mark.anyio
async def test_upload_file_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
    test_task: Task,
):
    """Test file upload fails when accessing another user's task."""
    from app.core.security import create_access_token, get_password_hash

    # Create another user
    other_user = User(
        id=str(uuid.uuid4()),
        email="other@example.com",
        password_hash=get_password_hash("password123"),
        name="Other User",
        plan="free",
        api_usage_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(other_user)
    await db_session.commit()

    # Create auth headers for the other user
    other_token = create_access_token(subject=other_user.id)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    file_content = b"test content"
    file = io.BytesIO(file_content)

    response = await client.post(
        f"/api/v1/tasks/{test_task.id}/upload",
        headers=other_headers,
        files={"file": ("test.txt", file, "text/plain")},
    )

    assert response.status_code == 403


@pytest.mark.anyio
async def test_upload_file_task_not_found(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test file upload fails when task doesn't exist."""
    fake_task_id = str(uuid.uuid4())
    file_content = b"test content"
    file = io.BytesIO(file_content)

    response = await client.post(
        f"/api/v1/tasks/{fake_task_id}/upload",
        headers=auth_headers,
        files={"file": ("test.txt", file, "text/plain")},
    )

    assert response.status_code == 404


@pytest.mark.anyio
async def test_download_task_results_zip(
    client: AsyncClient,
    auth_headers: dict,
    test_task: Task,
    db_session: AsyncSession,
):
    """Test downloading task results as a ZIP file."""
    from app.models.task_result import TaskResult

    # Create some task results
    # Need an agent_id for NOT NULL constraint
    from app.models.agent import Agent
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=test_task.team_id,
        name="Test Agent",
        role="assistant",
        layer="execution",
        model="sonnet",
        tools=[],
        sort_order=0,
        status="idle",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()

    result1 = TaskResult(
        id=str(uuid.uuid4()),
        task_id=test_task.id,
        agent_id=agent.id,
        result_type="output",
        content="Result output content",
        version=1,
        created_at=datetime.utcnow(),
    )
    result2 = TaskResult(
        id=str(uuid.uuid4()),
        task_id=test_task.id,
        agent_id=agent.id,
        result_type="log",
        content="Log content",
        version=1,
        created_at=datetime.utcnow(),
    )
    db_session.add(result1)
    db_session.add(result2)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/tasks/{test_task.id}/results/download",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "attachment" in response.headers["content-disposition"]
    assert len(response.content) > 0


@pytest.mark.anyio
async def test_download_task_results_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
    test_task: Task,
):
    """Test downloading task results fails for another user's task."""
    from app.core.security import create_access_token, get_password_hash

    # Create another user
    other_user = User(
        id=str(uuid.uuid4()),
        email="other2@example.com",
        password_hash=get_password_hash("password123"),
        name="Other User 2",
        plan="free",
        api_usage_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(other_user)
    await db_session.commit()

    # Create auth headers for the other user
    other_token = create_access_token(subject=other_user.id)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    response = await client.get(
        f"/api/v1/tasks/{test_task.id}/results/download",
        headers=other_headers,
    )

    assert response.status_code == 403

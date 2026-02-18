import uuid
from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.task import Task
from app.models.task_result import TaskResult


@pytest.fixture
async def owner_agent(db_session: AsyncSession, test_team) -> Agent:
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        name="Owner Agent",
        role="writer",
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
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def owner_task(db_session: AsyncSession, test_user, test_team) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        team_id=test_team.id,
        user_id=test_user.id,
        type="content",
        input={"text": "hello"},
        options={"tone": "casual"},
        status="running",
        progress=35,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def other_agent(db_session: AsyncSession, test_team_other_user) -> Agent:
    agent = Agent(
        id=str(uuid.uuid4()),
        team_id=test_team_other_user.id,
        name="Other Agent",
        role="writer",
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
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def other_user_task(db_session: AsyncSession, test_team_other_user) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        team_id=test_team_other_user.id,
        user_id=test_team_other_user.user_id,
        type="content",
        input={"text": "other"},
        options={},
        status="running",
        progress=10,
        created_at=datetime.utcnow(),
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def seeded_results(
    db_session: AsyncSession,
    owner_task: Task,
    owner_agent: Agent,
    other_user_task: Task,
    other_agent: Agent,
) -> dict[str, TaskResult]:
    result_blog_v1 = TaskResult(
        id=str(uuid.uuid4()),
        task_id=owner_task.id,
        agent_id=owner_agent.id,
        result_type="blog",
        content="blog v1",
        file_url=None,
        result_metadata={"model": "sonnet"},
        quality_score=0.81,
        version=1,
        created_at=datetime.utcnow(),
    )
    result_blog_v2 = TaskResult(
        id=str(uuid.uuid4()),
        task_id=owner_task.id,
        agent_id=owner_agent.id,
        result_type="blog",
        content="blog v2",
        file_url="https://example.com/file/blog-v2.txt",
        result_metadata={"model": "opus"},
        quality_score=0.9,
        version=2,
        created_at=datetime.utcnow(),
    )
    result_sns = TaskResult(
        id=str(uuid.uuid4()),
        task_id=owner_task.id,
        agent_id=owner_agent.id,
        result_type="sns",
        content="sns post",
        file_url=None,
        result_metadata={"hashtags": 3},
        quality_score=0.7,
        version=1,
        created_at=datetime.utcnow(),
    )
    other_result = TaskResult(
        id=str(uuid.uuid4()),
        task_id=other_user_task.id,
        agent_id=other_agent.id,
        result_type="blog",
        content="other content",
        file_url=None,
        result_metadata={},
        quality_score=0.5,
        version=1,
        created_at=datetime.utcnow(),
    )

    db_session.add_all([result_blog_v1, result_blog_v2, result_sns, other_result])
    await db_session.commit()

    for item in [result_blog_v1, result_blog_v2, result_sns, other_result]:
        await db_session.refresh(item)

    return {
        "result_blog_v1": result_blog_v1,
        "result_blog_v2": result_blog_v2,
        "result_sns": result_sns,
        "other_result": other_result,
    }


class TestListTaskResults:
    @pytest.mark.anyio
    async def test_list_task_results_success(self, client, auth_headers, owner_task, seeded_results):
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["results"]) == 3
        result_types = {item["result_type"] for item in data["results"]}
        assert result_types == {"blog", "sns"}
        assert "metadata" in data["results"][0]

    @pytest.mark.anyio
    async def test_list_task_results_filter_by_type(
        self,
        client,
        auth_headers,
        owner_task,
        seeded_results,
    ):
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results?result_type=blog",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(item["result_type"] == "blog" for item in data["results"])

    @pytest.mark.anyio
    async def test_list_task_results_task_not_found(self, client, auth_headers):
        response = await client.get(
            f"/api/v1/tasks/{str(uuid.uuid4())}/results",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_list_task_results_forbidden(
        self,
        client,
        auth_headers,
        other_user_task,
        seeded_results,
    ):
        response = await client.get(
            f"/api/v1/tasks/{other_user_task.id}/results",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_list_task_results_unauthenticated(self, client, owner_task):
        response = await client.get(f"/api/v1/tasks/{owner_task.id}/results")

        assert response.status_code == 401


class TestDownloadTaskResult:
    @pytest.mark.anyio
    async def test_download_redirects_to_file_url(
        self,
        client,
        auth_headers,
        owner_task,
        seeded_results,
    ):
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results/{seeded_results['result_blog_v2'].id}/download",
            headers=auth_headers,
        )

        assert response.status_code == 307
        assert response.headers["location"] == "https://example.com/file/blog-v2.txt"

    @pytest.mark.anyio
    async def test_download_returns_text_attachment_when_no_file_url(
        self,
        client,
        auth_headers,
        owner_task,
        seeded_results,
    ):
        result_id = seeded_results["result_sns"].id
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results/{result_id}/download",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.text == "sns post"
        disposition = response.headers.get("content-disposition", "")
        assert disposition.startswith("attachment; filename=")

    @pytest.mark.anyio
    async def test_download_result_not_found(self, client, auth_headers, owner_task):
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results/{str(uuid.uuid4())}/download",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Task result not found"

    @pytest.mark.anyio
    async def test_download_task_not_found(self, client, auth_headers):
        response = await client.get(
            f"/api/v1/tasks/{str(uuid.uuid4())}/results/{str(uuid.uuid4())}/download",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    @pytest.mark.anyio
    async def test_download_forbidden(
        self,
        client,
        auth_headers,
        other_user_task,
        seeded_results,
    ):
        response = await client.get(
            f"/api/v1/tasks/{other_user_task.id}/results/{seeded_results['other_result'].id}/download",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_download_unauthenticated(self, client, owner_task, seeded_results):
        response = await client.get(
            f"/api/v1/tasks/{owner_task.id}/results/{seeded_results['result_blog_v1'].id}/download"
        )

        assert response.status_code == 401

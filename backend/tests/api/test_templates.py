# @TASK P2-R3-T1 - Team Templates API TDD tests
# @SPEC docs/planning/02-trd.md#team-templates
# @TEST tests/api/test_templates.py
"""Tests for team templates endpoints (list, filter by category).

Follows RED -> GREEN -> REFACTOR TDD cycle.
"""
import uuid
from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_template import TeamTemplate


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def seed_templates(db_session: AsyncSession):
    """Seed 3 test templates into the database."""
    templates = [
        TeamTemplate(
            id=str(uuid.uuid4()),
            name="마케팅 팀",
            description="마케팅 캠페인 및 콘텐츠 관리를 위한 AI 팀",
            category="marketing",
            icon="megaphone",
            default_agents=[
                {"role": "copywriter", "name": "카피라이터"},
                {"role": "designer", "name": "디자이너"},
                {"role": "analyst", "name": "분석가"},
                {"role": "strategist", "name": "전략가"},
                {"role": "social_media", "name": "소셜미디어 매니저"},
            ],
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        TeamTemplate(
            id=str(uuid.uuid4()),
            name="개발 팀",
            description="소프트웨어 개발 프로젝트를 위한 AI 팀",
            category="development",
            icon="code",
            default_agents=[
                {"role": "backend", "name": "백엔드 개발자"},
                {"role": "frontend", "name": "프론트엔드 개발자"},
                {"role": "devops", "name": "DevOps 엔지니어"},
                {"role": "qa", "name": "QA 엔지니어"},
            ],
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        TeamTemplate(
            id=str(uuid.uuid4()),
            name="고객 지원 팀",
            description="고객 문의 및 지원을 위한 AI 팀",
            category="support",
            icon="headset",
            default_agents=[
                {"role": "support_agent", "name": "지원 상담사"},
                {"role": "escalation", "name": "에스컬레이션 매니저"},
                {"role": "knowledge_base", "name": "지식베이스 관리자"},
            ],
            is_active=True,
            created_at=datetime.utcnow(),
        ),
    ]

    for template in templates:
        db_session.add(template)
    await db_session.commit()

    # Refresh to ensure all fields are loaded
    for template in templates:
        await db_session.refresh(template)

    return templates


@pytest.fixture
async def seed_templates_with_inactive(db_session: AsyncSession, seed_templates):
    """Seed templates including one inactive template."""
    inactive_template = TeamTemplate(
        id=str(uuid.uuid4()),
        name="비활성 팀",
        description="비활성화된 팀 템플릿",
        category="marketing",
        icon="archive",
        default_agents=[{"role": "inactive", "name": "비활성 에이전트"}],
        is_active=False,
        created_at=datetime.utcnow(),
    )
    db_session.add(inactive_template)
    await db_session.commit()
    await db_session.refresh(inactive_template)

    return seed_templates + [inactive_template]


# ---------------------------------------------------------------------------
# GET /api/v1/templates - List templates
# ---------------------------------------------------------------------------

class TestListTemplates:
    """Tests for GET /api/v1/templates."""

    @pytest.mark.anyio
    async def test_list_templates_returns_200(self, client, seed_templates):
        """List templates returns 200 with all active templates."""
        response = await client.get("/api/v1/templates")

        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "total" in data
        assert data["total"] == 3
        assert len(data["templates"]) == 3

    @pytest.mark.anyio
    async def test_list_templates_active_only(self, client, seed_templates_with_inactive):
        """List templates returns only active templates, excluding inactive ones."""
        response = await client.get("/api/v1/templates")

        assert response.status_code == 200
        data = response.json()
        # Should only return 3 active templates, not the inactive one
        assert data["total"] == 3
        assert len(data["templates"]) == 3

        # Verify no inactive template is returned
        names = [t["name"] for t in data["templates"]]
        assert "비활성 팀" not in names

    @pytest.mark.anyio
    async def test_list_templates_no_auth_required(self, client, seed_templates):
        """Templates endpoint is public - no authentication required."""
        # No auth headers provided
        response = await client.get("/api/v1/templates")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3

    @pytest.mark.anyio
    async def test_list_templates_empty(self, client):
        """List templates returns empty list when no templates exist."""
        response = await client.get("/api/v1/templates")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["templates"] == []


# ---------------------------------------------------------------------------
# GET /api/v1/templates?category=... - Filter by category
# ---------------------------------------------------------------------------

class TestListTemplatesByCategory:
    """Tests for GET /api/v1/templates?category=<value>."""

    @pytest.mark.anyio
    async def test_filter_by_marketing_category(self, client, seed_templates):
        """Filter templates by 'marketing' category returns only marketing templates."""
        response = await client.get("/api/v1/templates?category=marketing")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["templates"]) == 1
        assert data["templates"][0]["category"] == "marketing"
        assert data["templates"][0]["name"] == "마케팅 팀"

    @pytest.mark.anyio
    async def test_filter_by_development_category(self, client, seed_templates):
        """Filter templates by 'development' category returns only dev templates."""
        response = await client.get("/api/v1/templates?category=development")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["templates"][0]["category"] == "development"

    @pytest.mark.anyio
    async def test_filter_by_support_category(self, client, seed_templates):
        """Filter templates by 'support' category returns only support templates."""
        response = await client.get("/api/v1/templates?category=support")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["templates"][0]["category"] == "support"

    @pytest.mark.anyio
    async def test_filter_by_nonexistent_category(self, client, seed_templates):
        """Filter by a category that doesn't exist returns empty list."""
        response = await client.get("/api/v1/templates?category=nonexistent")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["templates"] == []

    @pytest.mark.anyio
    async def test_filter_excludes_inactive_in_category(
        self, client, seed_templates_with_inactive
    ):
        """Category filter also excludes inactive templates."""
        response = await client.get("/api/v1/templates?category=marketing")

        assert response.status_code == 200
        data = response.json()
        # Only 1 active marketing template, not the inactive one
        assert data["total"] == 1
        assert data["templates"][0]["name"] == "마케팅 팀"


# ---------------------------------------------------------------------------
# Template response fields validation
# ---------------------------------------------------------------------------

class TestTemplateFields:
    """Tests to verify template response contains all required fields."""

    @pytest.mark.anyio
    async def test_response_contains_all_fields(self, client, seed_templates):
        """Each template in response contains all required fields."""
        response = await client.get("/api/v1/templates")

        assert response.status_code == 200
        data = response.json()

        required_fields = {"id", "name", "description", "category", "icon", "default_agents"}

        for template in data["templates"]:
            for field in required_fields:
                assert field in template, f"Missing field: {field}"

    @pytest.mark.anyio
    async def test_default_agents_is_list(self, client, seed_templates):
        """default_agents field is a list of agent objects."""
        response = await client.get("/api/v1/templates")

        data = response.json()
        for template in data["templates"]:
            assert isinstance(template["default_agents"], list)
            assert len(template["default_agents"]) > 0

            # Each agent should have role and name
            for agent in template["default_agents"]:
                assert "role" in agent
                assert "name" in agent

    @pytest.mark.anyio
    async def test_marketing_team_has_5_agents(self, client, seed_templates):
        """Marketing team template has exactly 5 default agents."""
        response = await client.get("/api/v1/templates?category=marketing")

        data = response.json()
        marketing_template = data["templates"][0]
        assert len(marketing_template["default_agents"]) == 5

    @pytest.mark.anyio
    async def test_development_team_has_4_agents(self, client, seed_templates):
        """Development team template has exactly 4 default agents."""
        response = await client.get("/api/v1/templates?category=development")

        data = response.json()
        dev_template = data["templates"][0]
        assert len(dev_template["default_agents"]) == 4

    @pytest.mark.anyio
    async def test_support_team_has_3_agents(self, client, seed_templates):
        """Support team template has exactly 3 default agents."""
        response = await client.get("/api/v1/templates?category=support")

        data = response.json()
        support_template = data["templates"][0]
        assert len(support_template["default_agents"]) == 3

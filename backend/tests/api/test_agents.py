# @TASK P2-R2-T1 - Agents API TDD tests
# @SPEC docs/planning/02-trd.md#agents-api
# @TEST tests/api/test_agents.py
"""Tests for Agents CRUD endpoints.

Follows RED -> GREEN -> REFACTOR TDD cycle.
"""
import pytest


# ---------------------------------------------------------------------------
# POST /api/v1/teams/{team_id}/agents
# ---------------------------------------------------------------------------

class TestCreateAgent:
    """Tests for POST /api/v1/teams/{team_id}/agents."""

    @pytest.mark.anyio
    async def test_create_agent_success(self, client, test_team, auth_headers):
        """Create an agent with valid data returns 201 and AgentResponse."""
        payload = {
            "name": "Researcher Bot",
            "role": "research_assistant",
            "layer": "research",
        }
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Researcher Bot"
        assert data["role"] == "research_assistant"
        assert data["layer"] == "research"
        assert data["model"] == "sonnet"  # default
        assert data["status"] == "idle"  # default
        assert data["sort_order"] == 0  # default
        assert data["tools"] == []  # default
        assert data["prompt_template"] is None
        assert data["team_id"] == test_team.id
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.anyio
    async def test_create_agent_all_fields(self, client, test_team, auth_headers):
        """Create an agent with all optional fields set."""
        payload = {
            "name": "Orchestrator",
            "role": "coordinator",
            "layer": "orchestration",
            "model": "opus",
            "prompt_template": "You are an orchestrator...",
            "tools": ["web_search", "code_executor"],
            "sort_order": 5,
        }
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Orchestrator"
        assert data["model"] == "opus"
        assert data["prompt_template"] == "You are an orchestrator..."
        assert data["tools"] == ["web_search", "code_executor"]
        assert data["sort_order"] == 5

    @pytest.mark.anyio
    async def test_create_agent_team_not_found(self, client, auth_headers):
        """Create an agent for a non-existent team returns 404."""
        payload = {
            "name": "Ghost Agent",
            "role": "research_assistant",
            "layer": "research",
        }
        response = await client.post(
            "/api/v1/teams/nonexistent-team-id/agents",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_create_agent_not_owner(
        self, client, test_team_other_user, auth_headers
    ):
        """Create an agent on another user's team returns 403."""
        payload = {
            "name": "Intruder Agent",
            "role": "research_assistant",
            "layer": "research",
        }
        response = await client.post(
            f"/api/v1/teams/{test_team_other_user.id}/agents",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_create_agent_unauthenticated(self, client, test_team):
        """Create an agent without auth returns 401."""
        payload = {
            "name": "Anon Agent",
            "role": "research_assistant",
            "layer": "research",
        }
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json=payload,
        )

        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_create_agent_invalid_layer(self, client, test_team, auth_headers):
        """Create an agent with invalid layer returns 422."""
        payload = {
            "name": "Bad Agent",
            "role": "researcher",
            "layer": "nonexistent_layer",
        }
        response = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/v1/teams/{team_id}/agents
# ---------------------------------------------------------------------------

class TestListAgents:
    """Tests for GET /api/v1/teams/{team_id}/agents."""

    @pytest.mark.anyio
    async def test_list_agents_empty(self, client, test_team, auth_headers):
        """List agents on a team with no agents returns empty list."""
        response = await client.get(
            f"/api/v1/teams/{test_team.id}/agents",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["agents"] == []
        assert data["total"] == 0

    @pytest.mark.anyio
    async def test_list_agents_with_data(self, client, test_team, auth_headers):
        """List agents returns created agents sorted by sort_order."""
        # Create agents with different sort_orders
        for name, order in [("Third", 3), ("First", 1), ("Second", 2)]:
            await client.post(
                f"/api/v1/teams/{test_team.id}/agents",
                json={"name": name, "role": "worker", "layer": "execution", "sort_order": order},
                headers=auth_headers,
            )

        response = await client.get(
            f"/api/v1/teams/{test_team.id}/agents",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["agents"]) == 3
        # Verify sort_order ascending
        assert data["agents"][0]["name"] == "First"
        assert data["agents"][1]["name"] == "Second"
        assert data["agents"][2]["name"] == "Third"

    @pytest.mark.anyio
    async def test_list_agents_only_own_team(
        self, client, test_team_other_user, auth_headers
    ):
        """Cannot list agents on another user's team - returns 403."""
        response = await client.get(
            f"/api/v1/teams/{test_team_other_user.id}/agents",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_list_agents_team_not_found(self, client, auth_headers):
        """List agents for non-existent team returns 404."""
        response = await client.get(
            "/api/v1/teams/nonexistent-team-id/agents",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_list_agents_unauthenticated(self, client, test_team):
        """List agents without auth returns 401."""
        response = await client.get(
            f"/api/v1/teams/{test_team.id}/agents",
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/v1/agents/{id}
# ---------------------------------------------------------------------------

class TestUpdateAgent:
    """Tests for PUT /api/v1/agents/{id}."""

    @pytest.mark.anyio
    async def test_update_agent_name(self, client, test_team, auth_headers):
        """Update agent name returns 200 with updated data."""
        # Create an agent first
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "Original", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        # Update the agent
        response = await client.put(
            f"/api/v1/agents/{agent_id}",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["role"] == "worker"  # unchanged

    @pytest.mark.anyio
    async def test_update_agent_role_and_model(self, client, test_team, auth_headers):
        """Update agent role and model returns 200 with updated data."""
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "Agent", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/agents/{agent_id}",
            json={"role": "senior_worker", "model": "opus"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "senior_worker"
        assert data["model"] == "opus"

    @pytest.mark.anyio
    async def test_update_agent_status(self, client, test_team, auth_headers):
        """Update agent status returns 200."""
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "Agent", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/agents/{agent_id}",
            json={"status": "running"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "running"

    @pytest.mark.anyio
    async def test_update_agent_not_found(self, client, auth_headers):
        """Update non-existent agent returns 404."""
        response = await client.put(
            "/api/v1/agents/nonexistent-agent-id",
            json={"name": "Ghost"},
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_update_agent_not_owner(
        self, client, test_team_other_user, auth_headers, db_session
    ):
        """Update agent belonging to another user's team returns 403."""
        from app.models.agent import Agent

        agent = Agent(
            team_id=test_team_other_user.id,
            name="Other Agent",
            role="worker",
            layer="execution",
            model="sonnet",
            status="idle",
            tools=[],
            sort_order=0,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.put(
            f"/api/v1/agents/{agent.id}",
            json={"name": "Hacked"},
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_update_agent_unauthenticated(self, client, test_team, auth_headers):
        """Update agent without auth returns 401."""
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "Agent", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/v1/agents/{agent_id}",
            json={"name": "Hacked"},
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /api/v1/agents/{id}
# ---------------------------------------------------------------------------

class TestDeleteAgent:
    """Tests for DELETE /api/v1/agents/{id}."""

    @pytest.mark.anyio
    async def test_delete_agent_success(self, client, test_team, auth_headers):
        """Delete an existing agent returns 204."""
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "To Delete", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify agent is gone
        get_response = await client.get(
            f"/api/v1/teams/{test_team.id}/agents",
            headers=auth_headers,
        )
        assert get_response.json()["total"] == 0

    @pytest.mark.anyio
    async def test_delete_agent_not_found(self, client, auth_headers):
        """Delete non-existent agent returns 404."""
        response = await client.delete(
            "/api/v1/agents/nonexistent-agent-id",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_delete_agent_not_owner(
        self, client, test_team_other_user, auth_headers, db_session
    ):
        """Delete agent belonging to another user's team returns 403."""
        from app.models.agent import Agent

        agent = Agent(
            team_id=test_team_other_user.id,
            name="Other Agent",
            role="worker",
            layer="execution",
            model="sonnet",
            status="idle",
            tools=[],
            sort_order=0,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.delete(
            f"/api/v1/agents/{agent.id}",
            headers=auth_headers,
        )

        assert response.status_code == 403

    @pytest.mark.anyio
    async def test_delete_agent_unauthenticated(self, client, test_team, auth_headers):
        """Delete agent without auth returns 401."""
        create_resp = await client.post(
            f"/api/v1/teams/{test_team.id}/agents",
            json={"name": "Agent", "role": "worker", "layer": "execution"},
            headers=auth_headers,
        )
        agent_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/agents/{agent_id}",
        )

        assert response.status_code == 401

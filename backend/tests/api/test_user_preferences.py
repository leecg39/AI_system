# @TASK P8-T4 - User preferences endpoints tests
"""Test user preferences endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


@pytest.mark.anyio
async def test_get_preferences_returns_defaults(
    client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
):
    """GET /api/v1/users/me/preferences returns default preferences when none set."""
    response = await client.get("/api/v1/users/me/preferences", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert "notifications" in data
    assert data["notifications"]["task_completed"] is True
    assert data["notifications"]["task_failed"] is True
    assert "theme" in data
    assert data["theme"] == "light"


@pytest.mark.anyio
async def test_update_preferences_success(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """PATCH /api/v1/users/me/preferences updates preferences successfully."""
    payload = {
        "notifications": {
            "task_completed": False,
            "task_failed": True
        },
        "theme": "dark"
    }

    response = await client.patch(
        "/api/v1/users/me/preferences",
        headers=auth_headers,
        json=payload
    )
    assert response.status_code == 200

    data = response.json()
    assert data["notifications"]["task_completed"] is False
    assert data["notifications"]["task_failed"] is True
    assert data["theme"] == "dark"


@pytest.mark.anyio
async def test_update_preferences_partial(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """PATCH /api/v1/users/me/preferences supports partial updates."""
    # First set some preferences
    initial_payload = {
        "notifications": {
            "task_completed": True,
            "task_failed": False
        },
        "theme": "dark"
    }
    await client.patch(
        "/api/v1/users/me/preferences",
        headers=auth_headers,
        json=initial_payload
    )

    # Now update only theme
    partial_payload = {"theme": "light"}
    response = await client.patch(
        "/api/v1/users/me/preferences",
        headers=auth_headers,
        json=partial_payload
    )
    assert response.status_code == 200

    data = response.json()
    # Theme should be updated
    assert data["theme"] == "light"
    # Notifications should remain unchanged
    assert data["notifications"]["task_completed"] is True
    assert data["notifications"]["task_failed"] is False


@pytest.mark.anyio
async def test_get_preferences_requires_auth(client: AsyncClient):
    """GET /api/v1/users/me/preferences returns 401 without auth."""
    response = await client.get("/api/v1/users/me/preferences")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_preferences_requires_auth(client: AsyncClient):
    """PATCH /api/v1/users/me/preferences returns 401 without auth."""
    payload = {"theme": "dark"}
    response = await client.patch("/api/v1/users/me/preferences", json=payload)
    assert response.status_code == 401

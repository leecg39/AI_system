# @TASK P1-R1-T1 - Auth API TDD tests
# @SPEC docs/planning/02-trd.md#authentication
# @TEST tests/api/test_auth.py
"""Tests for authentication endpoints (register, login, users/me).

Follows RED -> GREEN -> REFACTOR TDD cycle.
"""
import pytest
from tests.conftest import TEST_USER_EMAIL, TEST_USER_PASSWORD


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register
# ---------------------------------------------------------------------------

class TestRegister:
    """Tests for POST /api/v1/auth/register."""

    @pytest.mark.anyio
    async def test_register_success(self, client):
        """Register with valid data returns 201 and UserResponse."""
        payload = {
            "email": "new@example.com",
            "password": "strongpassword123",
            "name": "New User",
        }
        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"
        assert data["name"] == "New User"
        assert data["plan"] == "free"
        assert data["api_usage_count"] == 0
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        # Password hash must NOT be exposed
        assert "password_hash" not in data
        assert "password" not in data

    @pytest.mark.anyio
    async def test_register_duplicate_email(self, client, test_user):
        """Register with an already-registered email returns 400."""
        payload = {
            "email": "test@example.com",  # same as test_user
            "password": "anotherpassword",
            "name": "Duplicate User",
        }
        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    @pytest.mark.anyio
    async def test_register_invalid_email(self, client):
        """Register with an invalid email returns 422 (validation error)."""
        payload = {
            "email": "not-an-email",
            "password": "somepassword",
            "name": "Bad Email",
        }
        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_register_missing_fields(self, client):
        """Register with missing required fields returns 422."""
        # Missing name and password
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "partial@example.com"},
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login  (OAuth2 form-data)
# ---------------------------------------------------------------------------

class TestLoginForm:
    """Tests for POST /api/v1/auth/login (form-data)."""

    @pytest.mark.anyio
    async def test_login_success(self, client, test_user):
        """Login with correct credentials returns 200 and a Token."""
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "securepassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.anyio
    async def test_login_wrong_password(self, client, test_user):
        """Login with wrong password returns 401."""
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    @pytest.mark.anyio
    async def test_login_nonexistent_email(self, client):
        """Login with non-existent email returns 401."""
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@example.com", "password": "irrelevant"},
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login/json  (JSON body)
# ---------------------------------------------------------------------------

class TestLoginJson:
    """Tests for POST /api/v1/auth/login/json (JSON body)."""

    @pytest.mark.anyio
    async def test_login_json_success(self, client, test_user):
        """Login via JSON with correct credentials returns 200 and a Token."""
        response = await client.post(
            "/api/v1/auth/login/json",
            json={"email": "test@example.com", "password": "securepassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.anyio
    async def test_login_json_wrong_password(self, client, test_user):
        """Login via JSON with wrong password returns 401."""
        response = await client.post(
            "/api/v1/auth/login/json",
            json={"email": "test@example.com", "password": "wrong"},
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/v1/users/me
# ---------------------------------------------------------------------------

class TestGetMe:
    """Tests for GET /api/v1/users/me."""

    @pytest.mark.anyio
    async def test_get_me_authenticated(self, client, test_user, auth_headers):
        """Authenticated request returns 200 with UserResponse."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert data["id"] == test_user.id
        assert "password_hash" not in data

    @pytest.mark.anyio
    async def test_get_me_unauthenticated(self, client):
        """Request without token returns 401."""
        response = await client.get("/api/v1/users/me")

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /api/v1/users/me
# ---------------------------------------------------------------------------

class TestUpdateMe:
    """Tests for PATCH /api/v1/users/me."""

    @pytest.mark.anyio
    async def test_update_name(self, client, test_user, auth_headers):
        """Authenticated user can update their name."""
        response = await client.patch(
            "/api/v1/users/me",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        # Other fields unchanged
        assert data["email"] == "test@example.com"

    @pytest.mark.anyio
    async def test_update_me_unauthenticated(self, client):
        """Update without token returns 401."""
        response = await client.patch(
            "/api/v1/users/me",
            json={"name": "Hacker"},
        )

        assert response.status_code == 401


class TestPutMe:
    @pytest.mark.anyio
    async def test_put_name(self, client, test_user, auth_headers):
        response = await client.put(
            "/api/v1/users/me",
            json={"name": "Put Updated Name"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Put Updated Name"
        assert data["email"] == "test@example.com"

    @pytest.mark.anyio
    async def test_put_me_unauthenticated(self, client):
        response = await client.put(
            "/api/v1/users/me",
            json={"name": "Hacker"},
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/v1/auth/logout
# ---------------------------------------------------------------------------

class TestLogout:
    """Tests for POST /api/v1/auth/logout."""

    @pytest.mark.anyio
    async def test_logout_authenticated(self, client, test_user, auth_headers):
        """Authenticated logout returns success message."""
        response = await client.post("/api/v1/auth/logout", headers=auth_headers)

        assert response.status_code == 200
        assert "logged out" in response.json()["message"].lower()

    @pytest.mark.anyio
    async def test_logout_unauthenticated(self, client):
        """Logout without token returns 401."""
        response = await client.post("/api/v1/auth/logout")

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/v1/auth/password/change
# ---------------------------------------------------------------------------

class TestPasswordChange:
    """Tests for POST /api/v1/auth/password/change."""

    @pytest.mark.anyio
    async def test_change_password_success(self, client, test_user, auth_headers):
        """Change password with correct current password succeeds."""
        response = await client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": "securepassword123",
                "new_password": "newsecurepassword456",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert "changed" in response.json()["message"].lower()

        # Verify new password works for login
        login_response = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "newsecurepassword456"},
        )
        assert login_response.status_code == 200

    @pytest.mark.anyio
    async def test_change_password_wrong_current(self, client, test_user, auth_headers):
        """Change password with wrong current password returns 400."""
        response = await client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": "wrongcurrent",
                "new_password": "doesntmatter",
            },
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()

    @pytest.mark.anyio
    async def test_change_password_unauthenticated(self, client):
        """Change password without token returns 401."""
        response = await client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": "anything",
                "new_password": "anything",
            },
        )

        assert response.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /api/v1/users/me
# ---------------------------------------------------------------------------

class TestDeleteAccount:
    """Tests for DELETE /api/v1/users/me."""

    @pytest.mark.anyio
    async def test_delete_account_success(self, client, test_user, auth_headers):
        """Delete account returns 204 and user is deleted."""
        response = await client.delete("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == 204

    @pytest.mark.anyio
    async def test_delete_account_cannot_login_after_deletion(
        self, client, test_user, auth_headers
    ):
        """After deleting account, user cannot login."""
        # Delete the account
        delete_response = await client.delete("/api/v1/users/me", headers=auth_headers)
        assert delete_response.status_code == 204

        # Try to login with the deleted user's credentials
        login_response = await client.post(
            "/api/v1/auth/login",
            data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        )
        assert login_response.status_code == 401

    @pytest.mark.anyio
    async def test_delete_account_unauthenticated(self, client):
        """Delete account without token returns 401."""
        response = await client.delete("/api/v1/users/me")

        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_delete_account_cascades_to_teams(
        self, client, test_user, test_team, auth_headers, db_session
    ):
        """Deleting account also deletes associated teams."""
        from sqlalchemy import select
        from app.models.team import Team

        # Verify team exists
        result = await db_session.execute(
            select(Team).where(Team.id == test_team.id)
        )
        assert result.scalar_one_or_none() is not None

        # Delete account
        delete_response = await client.delete("/api/v1/users/me", headers=auth_headers)
        assert delete_response.status_code == 204

        # Verify team is also deleted
        result = await db_session.execute(
            select(Team).where(Team.id == test_team.id)
        )
        assert result.scalar_one_or_none() is None

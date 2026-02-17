# @TASK P0-T0.3 - Health check endpoint tests
# @TEST tests/api/test_health.py
"""Tests for health check and basic app functionality."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_health_check(client):
    """GET /health should return 200 with status healthy."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.anyio
async def test_docs_endpoint(client):
    """GET /docs should return 200 (Swagger UI)."""
    response = await client.get("/docs")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_redoc_endpoint(client):
    """GET /redoc should return 200 (ReDoc)."""
    response = await client.get("/redoc")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_openapi_json(client):
    """GET /openapi.json should return valid OpenAPI schema."""
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "paths" in data
    # Verify our routes are registered
    assert "/health" in data["paths"]
    assert "/api/v1/auth/login" in data["paths"]
    assert "/api/v1/users/me" in data["paths"]


@pytest.mark.anyio
async def test_cors_headers(client):
    """OPTIONS request should include CORS headers for allowed origin."""
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


@pytest.mark.anyio
async def test_cors_rejects_unknown_origin(client):
    """CORS should not include allow-origin header for unknown origins."""
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://evil-site.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # The origin should not be reflected back
    allow_origin = response.headers.get("access-control-allow-origin", "")
    assert allow_origin != "http://evil-site.com"

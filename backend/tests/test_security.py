# @TASK P9-T4 - Production security hardening tests
"""Tests for production security features and headers."""
import os
from typing import Optional
import pytest
from httpx import AsyncClient

from app.core.config import Settings


@pytest.mark.anyio
async def test_security_headers_present(client: AsyncClient):
    """Security headers should be present in all responses."""
    response = await client.get("/health")
    assert response.status_code == 200

    # Check basic security headers
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"

    # Check CSP is present
    csp = response.headers.get("content-security-policy")
    assert csp is not None
    assert "default-src 'self'" in csp


@pytest.mark.anyio
async def test_security_headers_on_api_routes(client: AsyncClient):
    """Security headers should be present on API routes."""
    response = await client.get("/docs")
    assert response.status_code == 200

    # Verify headers
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"


@pytest.mark.anyio
async def test_hsts_not_in_development(client: AsyncClient):
    """HSTS header should NOT be present in development mode."""
    response = await client.get("/health")

    # HSTS should not be set in non-production
    hsts = response.headers.get("strict-transport-security")
    assert hsts is None


def test_default_secret_key_detection():
    """Settings should detect default SECRET_KEY in production."""
    # Save original env
    original_env = os.environ.get("APP_ENV")

    try:
        # Test production mode with default SECRET_KEY
        os.environ["APP_ENV"] = "production"
        settings = Settings(SECRET_KEY="change-me-in-production")

        with pytest.raises(RuntimeError) as exc_info:
            settings.validate_production_config()

        assert "SECRET_KEY must be changed" in str(exc_info.value)
    finally:
        # Restore original env
        if original_env:
            os.environ["APP_ENV"] = original_env
        else:
            os.environ.pop("APP_ENV", None)


def test_wildcard_cors_detection():
    """Settings should detect wildcard CORS in production."""
    # Save original env
    original_env = os.environ.get("APP_ENV")

    try:
        # Test production mode with wildcard CORS
        os.environ["APP_ENV"] = "production"
        settings = Settings(
            SECRET_KEY="secure-random-key-for-testing",
            CORS_ORIGINS=["*"]
        )

        with pytest.raises(RuntimeError) as exc_info:
            settings.validate_production_config()

        assert "CORS_ORIGINS cannot contain wildcard" in str(exc_info.value)
    finally:
        # Restore original env
        if original_env:
            os.environ["APP_ENV"] = original_env
        else:
            os.environ.pop("APP_ENV", None)


def test_production_validation_passes_with_valid_config():
    """Production validation should pass with secure configuration."""
    # Save original env
    original_env = os.environ.get("APP_ENV")

    try:
        os.environ["APP_ENV"] = "production"
        settings = Settings(
            SECRET_KEY="secure-random-key-for-production-use",
            CORS_ORIGINS=["https://example.com", "https://app.example.com"]
        )

        # Should not raise any exception
        settings.validate_production_config()
    finally:
        # Restore original env
        if original_env:
            os.environ["APP_ENV"] = original_env
        else:
            os.environ.pop("APP_ENV", None)


def test_development_allows_default_secret():
    """Development mode should allow default SECRET_KEY."""
    # Save original env
    original_env = os.environ.get("APP_ENV")

    try:
        os.environ["APP_ENV"] = "development"
        settings = Settings(SECRET_KEY="change-me-in-production")

        # Should not raise - development mode is permissive
        settings.validate_production_config()
    finally:
        # Restore original env
        if original_env:
            os.environ["APP_ENV"] = original_env
        else:
            os.environ.pop("APP_ENV", None)


@pytest.mark.anyio
async def test_content_security_policy_basics(client: AsyncClient):
    """CSP header should have basic security directives."""
    response = await client.get("/health")

    csp = response.headers.get("content-security-policy", "")

    # Check key CSP directives
    assert "default-src 'self'" in csp
    assert "script-src" in csp
    assert "style-src" in csp
    assert "img-src" in csp
    assert "connect-src" in csp

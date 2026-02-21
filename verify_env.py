#!/usr/bin/env python3
"""
Environment Configuration Verification Script

This script verifies that environment configuration is correctly set up
for the AI Agent Team Platform.

Usage:
    python3 verify_env.py [development|production|docker]

If no environment is specified, it uses the APP_ENV environment variable
or defaults to 'development'.
"""

import os
import sys
from pathlib import Path


def check_file_exists(filepath: str, required: bool = True) -> bool:
    """Check if a file exists."""
    exists = Path(filepath).exists()
    status = "✅" if exists else ("❌" if required else "⚠️")
    req_str = "(required)" if required else "(optional)"
    print(f"{status} {filepath} {req_str}")
    return exists


def check_env_var(var_name: str, required: bool = True) -> bool:
    """Check if an environment variable is set."""
    value = os.getenv(var_name)
    has_value = value is not None and value != ""
    status = "✅" if has_value else ("❌" if required else "⚠️")
    req_str = "(required)" if required else "(optional)"

    if has_value:
        # Mask sensitive values
        if any(secret in var_name for secret in ["SECRET", "KEY", "PASSWORD"]):
            display_value = value[:8] + "..." if len(value) > 8 else "***"
        else:
            display_value = value[:50] + "..." if len(value) > 50 else value
        print(f"{status} {var_name}={display_value} {req_str}")
    else:
        print(f"{status} {var_name} not set {req_str}")

    return has_value


def verify_development():
    """Verify development environment setup."""
    print("\n=== Development Environment Verification ===\n")

    print("📁 Environment Files:")
    env_file = check_file_exists("backend/.env.development", required=True)
    check_file_exists("backend/.env.example", required=False)

    if not env_file:
        print("\n❌ Missing backend/.env.development")
        print("   Run: cp backend/.env.example backend/.env.development")
        return False

    # Load and check key variables
    print("\n🔧 Configuration:")
    os.environ.setdefault("APP_ENV", "development")

    try:
        sys.path.insert(0, str(Path("backend").resolve()))
        from app.core.config import settings

        print(f"✅ APP_ENV: {settings.APP_ENV}")
        print(f"✅ DATABASE_URL: {settings.DATABASE_URL}")
        print(f"✅ DEBUG: {settings.DEBUG}")
        print(f"✅ is_development: {settings.is_development}")

        # Check for SQLite
        if "sqlite" in settings.DATABASE_URL:
            print("✅ Using SQLite (recommended for development)")
        else:
            print("⚠️  Not using SQLite (PostgreSQL requires external setup)")

        # Check SECRET_KEY
        if settings.SECRET_KEY == "change-me-in-production":
            print("✅ Using default SECRET_KEY (OK for development)")

        print("\n✅ Development environment is correctly configured!")
        return True

    except Exception as e:
        print(f"\n❌ Error loading configuration: {e}")
        return False


def verify_production():
    """Verify production environment setup."""
    print("\n=== Production Environment Verification ===\n")

    print("📁 Environment Files:")
    env_file = check_file_exists("backend/.env.production", required=True)

    if not env_file:
        print("\n❌ Missing backend/.env.production")
        print("   Run: cp backend/.env.example backend/.env.production")
        print("   Then edit .env.production with production values")
        return False

    print("\n🔧 Configuration:")
    os.environ["APP_ENV"] = "production"

    try:
        sys.path.insert(0, str(Path("backend").resolve()))
        from app.core.config import settings

        has_errors = False

        # Check SECRET_KEY
        if settings.SECRET_KEY == "change-me-in-production":
            print("❌ SECRET_KEY is still default - MUST CHANGE!")
            print("   Generate: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\"")
            has_errors = True
        else:
            print("✅ SECRET_KEY has been changed")

        # Check DATABASE_URL
        if "postgresql" in settings.DATABASE_URL:
            print("✅ Using PostgreSQL (recommended for production)")
        else:
            print("⚠️  Not using PostgreSQL (SQLite not recommended for production)")

        # Check CORS
        if "*" in settings.CORS_ORIGINS:
            print("❌ CORS contains wildcard (*) - security risk!")
            has_errors = True
        elif "localhost" in str(settings.CORS_ORIGINS):
            print("⚠️  CORS includes localhost - should be production domain")
        else:
            print("✅ CORS is properly restricted")

        # Check DEBUG
        if settings.DEBUG:
            print("⚠️  DEBUG is enabled - should be false in production")
        else:
            print("✅ DEBUG is disabled")

        # Check OPENAI_API_KEY
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-your-api-key-here":
            print("❌ OPENAI_API_KEY not set or using placeholder")
            has_errors = True
        else:
            print("✅ OPENAI_API_KEY is configured")

        if has_errors:
            print("\n❌ Production configuration has errors - fix before deploying!")
            return False
        else:
            print("\n✅ Production environment is correctly configured!")
            return True

    except RuntimeError as e:
        print(f"\n❌ Production validation failed: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error loading configuration: {e}")
        return False


def verify_docker():
    """Verify Docker environment setup."""
    print("\n=== Docker Environment Verification ===\n")

    print("📁 Environment Files:")
    env_file = check_file_exists(".env.docker", required=True)
    check_file_exists("docker-compose.yml", required=True)

    if not env_file:
        print("\n❌ Missing .env.docker")
        print("   Run: cp backend/.env.example .env.docker")
        print("   Then edit .env.docker with Docker values")
        return False

    print("\n🐳 Docker Configuration:")

    # Read .env.docker
    env_vars = {}
    try:
        with open(".env.docker") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key] = value
    except Exception as e:
        print(f"❌ Error reading .env.docker: {e}")
        return False

    has_errors = False

    # Check key variables
    if env_vars.get("APP_ENV") == "docker":
        print("✅ APP_ENV=docker")
    else:
        print("⚠️  APP_ENV not set to 'docker'")

    # Check SECRET_KEY
    secret_key = env_vars.get("SECRET_KEY", "")
    if "change-me-in-production" in secret_key or "docker-dev-secret" in secret_key:
        print("⚠️  SECRET_KEY is default - change for production use")
    else:
        print("✅ SECRET_KEY has been customized")

    # Check OPENAI_API_KEY
    api_key = env_vars.get("OPENAI_API_KEY", "")
    if not api_key or "your-api-key-here" in api_key:
        print("❌ OPENAI_API_KEY not set")
        has_errors = True
    else:
        print("✅ OPENAI_API_KEY is configured")

    # Check ports
    backend_port = env_vars.get("BACKEND_PORT", "8000")
    frontend_port = env_vars.get("FRONTEND_PORT", "3000")
    print(f"✅ Ports: Backend={backend_port}, Frontend={frontend_port}")

    if has_errors:
        print("\n❌ Docker configuration has errors!")
        return False
    else:
        print("\n✅ Docker environment is correctly configured!")
        print("\n🚀 Next steps:")
        print("   1. docker-compose up -d")
        print("   2. Visit http://localhost:3000")
        return True


def main():
    """Main verification function."""
    print("🔍 AI Agent Team Platform - Environment Verification\n")

    # Determine environment
    if len(sys.argv) > 1:
        env = sys.argv[1].lower()
    else:
        env = os.getenv("APP_ENV", "development").lower()

    print(f"Environment: {env}\n")

    # Run appropriate verification
    if env == "development":
        success = verify_development()
    elif env == "production":
        success = verify_production()
    elif env == "docker":
        success = verify_docker()
    else:
        print(f"❌ Unknown environment: {env}")
        print("   Valid options: development, production, docker")
        sys.exit(1)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

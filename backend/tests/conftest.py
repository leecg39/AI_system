# @TASK P1-R1-T1 - Test configuration and fixtures
# @SPEC docs/planning/02-trd.md#authentication
"""Shared test fixtures for the backend test suite.

Provides:
- In-memory SQLite async database for isolation
- Dependency override so the app uses the test DB
- Helper fixtures for creating users and auth tokens
"""
import uuid
from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import JSON, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.models.team import Team
from app.models.notification import Notification  # noqa: F401


# ---------------------------------------------------------------------------
# SQLite compatibility: JSONB -> JSON mapping
# ---------------------------------------------------------------------------

@event.listens_for(Base.metadata, "column_reflect")
def _map_jsonb_to_json(inspector, table, column_info):
    if isinstance(column_info.get("type"), JSONB):
        column_info["type"] = JSON()


# Monkey-patch JSONB columns in metadata for SQLite create_all
_orig_jsonb_compile = None


def _setup_jsonb_for_sqlite():
    """Register a compilation extension so JSONB renders as JSON on SQLite."""
    from sqlalchemy.ext.compiler import compiles

    @compiles(JSONB, "sqlite")
    def _compile_jsonb_sqlite(type_, compiler, **kw):
        return "JSON"


# ---------------------------------------------------------------------------
# Database fixtures (SQLite in-memory, async via aiosqlite)
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def db_engine():
    """Create an in-memory SQLite engine for each test session."""
    _setup_jsonb_for_sqlite()
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign key constraints for SQLite
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Provide a transactional test database session."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_session):
    """Async HTTP test client with the DB dependency overridden."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# User helper fixtures
# ---------------------------------------------------------------------------

TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "securepassword123"
TEST_USER_NAME = "Test User"


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create and persist a test user, returning the ORM instance."""
    user = User(
        id=str(uuid.uuid4()),
        email=TEST_USER_EMAIL,
        password_hash=get_password_hash(TEST_USER_PASSWORD),
        name=TEST_USER_NAME,
        plan="free",
        api_usage_count=0,
        preferences={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """Return Authorization headers with a valid JWT for test_user."""
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Team helper fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def test_team(db_session: AsyncSession, test_user: User) -> Team:
    """Create and persist a test team owned by test_user."""
    team = Team(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Test Team",
        description="A test team for agents",
        config={},
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team


@pytest.fixture
async def test_team_other_user(db_session: AsyncSession) -> Team:
    """Create a team owned by a different user (not test_user)."""
    other_user = User(
        id=str(uuid.uuid4()),
        email="other@example.com",
        password_hash=get_password_hash("otherpassword123"),
        name="Other User",
        plan="free",
        api_usage_count=0,
        preferences={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(other_user)
    await db_session.commit()

    team = Team(
        id=str(uuid.uuid4()),
        user_id=other_user.id,
        name="Other Team",
        description="Team owned by another user",
        config={},
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team

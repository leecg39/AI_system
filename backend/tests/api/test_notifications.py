# @TASK P8-T2 - Notifications API TDD tests
# @SPEC phase-8-planning.md#notifications
"""Tests for Notifications API endpoints.

Follows RED -> GREEN -> REFACTOR TDD cycle.
Covers: list, unread count, mark as read, mark all as read with auth checks.
"""
import uuid
from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.notification import Notification


# ---------------------------------------------------------------------------
# Helper fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def sample_notifications(db_session: AsyncSession, test_user: User):
    """Create sample notifications for test_user."""
    notifications = [
        Notification(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            type="task_completed",
            title="Task Completed",
            message="Your task 'Data Analysis' has been completed successfully.",
            is_read=False,
            link="/tasks/task-123",
            created_at=datetime.utcnow(),
        ),
        Notification(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            type="task_failed",
            title="Task Failed",
            message="Task 'Model Training' has failed.",
            is_read=True,
            link="/tasks/task-456",
            created_at=datetime.utcnow(),
        ),
        Notification(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            type="team_created",
            title="New Team Created",
            message="Team 'Marketing Team' has been created.",
            is_read=False,
            link="/teams/team-789",
            created_at=datetime.utcnow(),
        ),
    ]
    for notif in notifications:
        db_session.add(notif)
    await db_session.commit()
    return notifications


@pytest.fixture
async def other_user_notification(db_session: AsyncSession):
    """Create a notification for another user to test isolation."""
    from app.core.security import get_password_hash
    other_user = User(
        id=str(uuid.uuid4()),
        email="notif_other@example.com",
        password_hash=get_password_hash("password123"),
        name="Notif Other User",
        plan="free",
        api_usage_count=0,
        preferences={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(other_user)
    await db_session.commit()

    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=other_user.id,
        type="task_completed",
        title="Other User's Notification",
        message="This should not be visible to test_user.",
        is_read=False,
        link="/tasks/other-task",
        created_at=datetime.utcnow(),
    )
    db_session.add(notif)
    await db_session.commit()
    return notif


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_notifications_success(client, auth_headers, sample_notifications):
    """Test listing notifications returns only user's notifications."""
    response = await client.get("/api/v1/notifications", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "notifications" in data
    assert "total" in data
    assert data["total"] == 3
    assert len(data["notifications"]) == 3

    # Check fields
    notif = data["notifications"][0]
    assert "id" in notif
    assert "type" in notif
    assert "title" in notif
    assert "message" in notif
    assert "is_read" in notif
    assert "link" in notif
    assert "created_at" in notif


@pytest.mark.asyncio
async def test_list_notifications_isolation(
    client, auth_headers, sample_notifications, other_user_notification
):
    """Test that users only see their own notifications."""
    response = await client.get("/api/v1/notifications", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3  # Only test_user's notifications

    # Verify other_user's notification is not included
    notification_ids = [n["id"] for n in data["notifications"]]
    assert other_user_notification.id not in notification_ids


@pytest.mark.asyncio
async def test_list_notifications_unauthorized(client):
    """Test listing notifications without auth returns 401."""
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_unread_count_success(client, auth_headers, sample_notifications):
    """Test getting unread notification count."""
    response = await client.get("/api/v1/notifications/unread-count", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "unread_count" in data
    assert data["unread_count"] == 2  # Two unread notifications


@pytest.mark.asyncio
async def test_get_unread_count_unauthorized(client):
    """Test getting unread count without auth returns 401."""
    response = await client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mark_notification_as_read_success(
    client, auth_headers, sample_notifications, db_session
):
    """Test marking a notification as read."""
    unread_notif = sample_notifications[0]  # First notification is unread
    assert not unread_notif.is_read

    response = await client.patch(
        f"/api/v1/notifications/{unread_notif.id}/read",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == unread_notif.id
    assert data["is_read"] is True

    # Verify in database
    await db_session.refresh(unread_notif)
    assert unread_notif.is_read is True


@pytest.mark.asyncio
async def test_mark_notification_as_read_not_found(client, auth_headers):
    """Test marking non-existent notification returns 404."""
    fake_id = str(uuid.uuid4())
    response = await client.patch(
        f"/api/v1/notifications/{fake_id}/read",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_mark_notification_as_read_unauthorized(client, sample_notifications):
    """Test marking notification as read without auth returns 401."""
    notif_id = sample_notifications[0].id
    response = await client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mark_all_as_read_success(
    client, auth_headers, sample_notifications, db_session
):
    """Test marking all notifications as read."""
    response = await client.post("/api/v1/notifications/read-all", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "updated_count" in data
    assert data["updated_count"] == 2  # Two were unread

    # Verify all are marked as read in database
    for notif in sample_notifications:
        await db_session.refresh(notif)
        assert notif.is_read is True


@pytest.mark.asyncio
async def test_mark_all_as_read_unauthorized(client):
    """Test marking all as read without auth returns 401."""
    response = await client.post("/api/v1/notifications/read-all")
    assert response.status_code == 401

# @TASK P8-T2 - Notifications API endpoints
# @SPEC phase-8-planning.md#notifications
"""Notifications API endpoints with JWT authentication."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
    MarkAllReadResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all notifications for the authenticated user (newest first)."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=len(notifications),
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get count of unread notifications for the authenticated user."""
    stmt = (
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    result = await db.execute(stmt)
    count = result.scalar_one()

    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark a specific notification as read."""
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse.model_validate(notification)


@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_as_read(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark all notifications as read for the authenticated user."""
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.commit()

    return MarkAllReadResponse(updated_count=result.rowcount)

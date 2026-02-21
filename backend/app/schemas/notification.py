# @TASK P8-T2 - Notification schemas
# @SPEC phase-8-planning.md#notifications
"""Notification request/response schemas for the Notifications API."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Schema for a single notification in API responses."""
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Schema for the notification list endpoint response."""
    notifications: List[NotificationResponse]
    total: int


class UnreadCountResponse(BaseModel):
    """Schema for unread notification count response."""
    unread_count: int


class MarkAllReadResponse(BaseModel):
    """Schema for mark all as read response."""
    updated_count: int

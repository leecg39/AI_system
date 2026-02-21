# @TASK P0-T0.3 - User schemas
# @SPEC docs/planning/02-trd.md#user-api
"""User schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None


class UserResponse(UserBase):
    id: str
    plan: str
    api_usage_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserInDB(UserResponse):
    password_hash: str


class NotificationPreferences(BaseModel):
    """Notification preferences schema."""
    task_completed: bool = True
    task_failed: bool = True


class UserPreferences(BaseModel):
    """User preferences schema."""
    notifications: NotificationPreferences = NotificationPreferences()
    theme: str = "light"


class UserPreferencesUpdate(BaseModel):
    """User preferences update schema (partial updates allowed)."""
    notifications: Optional[NotificationPreferences] = None
    theme: Optional[str] = None


class UserPreferencesResponse(UserPreferences):
    """User preferences response schema."""
    model_config = {"from_attributes": True}

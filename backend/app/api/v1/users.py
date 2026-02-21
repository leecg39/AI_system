# @TASK P0-T0.3 - User endpoints
# @SPEC docs/planning/02-trd.md#user-api
"""User endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: CurrentUser):
    """Get current user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current user's profile."""
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=204)
async def delete_current_user_account(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete current user's account and all associated data."""
    await db.delete(current_user)
    await db.commit()
    return None


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(current_user: CurrentUser):
    """Get current user's preferences."""
    # Return default preferences if none set
    prefs = current_user.preferences or {}

    return {
        "notifications": prefs.get("notifications", {
            "task_completed": True,
            "task_failed": True
        }),
        "theme": prefs.get("theme", "light")
    }


@router.patch("/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current user's preferences (partial updates supported)."""
    # Get current preferences or initialize empty dict
    current_prefs = current_user.preferences or {}

    # Update only provided fields (partial update)
    update_data = preferences_update.model_dump(exclude_unset=True)

    if "notifications" in update_data:
        # Merge notification preferences
        current_notifications = current_prefs.get("notifications", {})
        current_notifications.update(update_data["notifications"])
        current_prefs["notifications"] = current_notifications

    if "theme" in update_data:
        current_prefs["theme"] = update_data["theme"]

    # Update user model
    current_user.preferences = current_prefs

    await db.commit()
    await db.refresh(current_user)

    return {
        "notifications": current_prefs.get("notifications", {
            "task_completed": True,
            "task_failed": True
        }),
        "theme": current_prefs.get("theme", "light")
    }

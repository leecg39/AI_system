# @TASK P2-R1-T1 - Team schemas
# @SPEC docs/planning/02-trd.md#teams-api
"""Team request/response schemas for the Teams API."""
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.models.team import TeamStatusEnum


class TeamCreate(BaseModel):
    """Schema for creating a new team."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[dict] = None
    template_id: Optional[str] = None


class TeamUpdate(BaseModel):
    """Schema for updating a team (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[dict] = None
    status: Optional[TeamStatusEnum] = None


class TeamResponse(BaseModel):
    """Schema for a single team in API responses."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    template_id: Optional[str] = None
    config: dict = {}
    status: str
    agent_count: int = 0
    recent_task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeamListResponse(BaseModel):
    """Schema for the team list endpoint response."""
    teams: List[TeamResponse]
    total: int

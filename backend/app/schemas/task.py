from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.task import TaskStatusEnum


class TaskCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    input: dict[str, Any] = Field(default_factory=dict)
    options: dict[str, Any] = Field(default_factory=dict)


class TaskResponse(BaseModel):
    id: str
    team_id: str
    user_id: str
    type: str
    input: dict[str, Any]
    options: dict[str, Any]
    status: str
    progress: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    team_name: str
    duration: Optional[str] = None


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    limit: int


class TaskListFilters(BaseModel):
    team_id: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    type: Optional[str] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

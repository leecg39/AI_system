# @TASK P2-R2-T1 - Agent schemas for validation and serialization
# @SPEC docs/planning/02-trd.md#agents-api
"""Agent Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.agent import AgentStatusEnum, LayerEnum, ModelEnum


class AgentCreate(BaseModel):
    """Schema for creating a new agent."""
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    layer: LayerEnum
    model: Optional[ModelEnum] = None
    prompt_template: Optional[str] = None
    tools: Optional[List[str]] = None
    sort_order: Optional[int] = Field(default=None, ge=0)


class AgentUpdate(BaseModel):
    """Schema for updating an existing agent (all fields optional)."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    role: Optional[str] = Field(default=None, min_length=1, max_length=255)
    layer: Optional[LayerEnum] = None
    model: Optional[ModelEnum] = None
    prompt_template: Optional[str] = None
    tools: Optional[List[str]] = None
    sort_order: Optional[int] = Field(default=None, ge=0)
    status: Optional[AgentStatusEnum] = None


class AgentResponse(BaseModel):
    """Schema for agent responses."""
    id: str
    team_id: str
    name: str
    role: str
    layer: str
    model: str
    prompt_template: Optional[str] = None
    tools: List[str]
    sort_order: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    """Schema for paginated agent list responses."""
    agents: List[AgentResponse]
    total: int

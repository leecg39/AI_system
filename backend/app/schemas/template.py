# @TASK P2-R3-T1 - Team Template schemas
# @SPEC docs/planning/02-trd.md#team-templates
"""Team Template schemas for API request/response validation."""
from typing import Any, List, Optional

from pydantic import BaseModel


class TemplateResponse(BaseModel):
    """Schema for a single team template in API responses."""
    id: str
    name: str
    description: Optional[str] = None
    category: str
    icon: Optional[str] = None
    default_agents: List[Any] = []
    is_active: bool = True

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """Schema for the list-templates endpoint response."""
    templates: List[TemplateResponse]
    total: int

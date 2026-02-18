from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TaskResultResponse(BaseModel):
    id: str
    task_id: str
    agent_id: str
    result_type: str
    content: str
    file_url: Optional[str] = None
    metadata: dict[str, object]
    quality_score: Optional[float] = None
    version: int
    created_at: datetime


class TaskResultListResponse(BaseModel):
    results: list[TaskResultResponse]
    total: int

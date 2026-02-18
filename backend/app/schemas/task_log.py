from datetime import datetime

from pydantic import BaseModel


class TaskLogResponse(BaseModel):
    id: str
    task_id: str
    agent_id: str
    status: str
    message: str
    progress: int
    created_at: datetime


class TaskLogListResponse(BaseModel):
    logs: list[TaskLogResponse]
    total: int

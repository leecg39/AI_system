from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.task_log import TaskLogListResponse
from app.services.task import get_task_with_team_name
from app.services.task_log import list_task_logs, to_task_log_response

router = APIRouter(tags=["task-logs"])


@router.get("/tasks/{task_id}/logs", response_model=TaskLogListResponse)
async def list_task_logs_endpoint(
    task_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    row = await get_task_with_team_name(db, task_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task, _ = row
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task",
        )

    logs = await list_task_logs(db, task_id)
    return TaskLogListResponse(
        logs=[to_task_log_response(item) for item in logs],
        total=len(logs),
    )

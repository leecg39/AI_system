from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task_log import TaskLog
from app.schemas.task_log import TaskLogResponse


async def list_task_logs(db: AsyncSession, task_id: str) -> List[TaskLog]:
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id)
        .order_by(TaskLog.created_at.asc())
    )
    return list(result.scalars().all())


def to_task_log_response(task_log: TaskLog) -> TaskLogResponse:
    return TaskLogResponse(
        id=task_log.id,
        task_id=task_log.task_id,
        agent_id=task_log.agent_id,
        status=task_log.status,
        message=task_log.message,
        progress=task_log.progress,
        created_at=task_log.created_at,
    )

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task_result import TaskResult
from app.schemas.task_result import TaskResultResponse


async def list_task_results(
    db: AsyncSession,
    task_id: str,
    result_type: Optional[str] = None,
) -> List[TaskResult]:
    query = select(TaskResult).where(TaskResult.task_id == task_id)
    if result_type is not None:
        query = query.where(TaskResult.result_type == result_type)

    query = query.order_by(TaskResult.created_at.desc(), TaskResult.version.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_task_result(
    db: AsyncSession,
    task_id: str,
    result_id: str,
) -> Optional[TaskResult]:
    result = await db.execute(
        select(TaskResult).where(
            TaskResult.task_id == task_id,
            TaskResult.id == result_id,
        )
    )
    return result.scalar_one_or_none()


def to_task_result_response(task_result: TaskResult) -> TaskResultResponse:
    return TaskResultResponse(
        id=task_result.id,
        task_id=task_result.task_id,
        agent_id=task_result.agent_id,
        result_type=task_result.result_type,
        content=task_result.content,
        file_url=task_result.file_url,
        metadata=task_result.result_metadata,
        quality_score=task_result.quality_score,
        version=task_result.version,
        created_at=task_result.created_at,
    )

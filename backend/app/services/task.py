from datetime import datetime
import logging
import os
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.celery_app import celery_app
from app.models.task import Task, TaskStatusEnum
from app.models.team import Team
from app.models.user import User
from app.schemas.task import TaskCreate, TaskListFilters, TaskResponse

logger = logging.getLogger(__name__)


async def verify_team_ownership(
    db: AsyncSession,
    team_id: str,
    current_user: User,
) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if team.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this team",
        )

    return team


def _build_conditions(user_id: str, filters: TaskListFilters) -> List[ColumnElement[bool]]:
    conditions: List[ColumnElement[bool]] = [Task.user_id == user_id]

    if filters.team_id is not None:
        conditions.append(Task.team_id == filters.team_id)
    if filters.status is not None:
        conditions.append(Task.status == filters.status.value)
    if filters.type is not None:
        conditions.append(Task.type == filters.type)
    if filters.created_from is not None:
        conditions.append(Task.created_at >= filters.created_from)
    if filters.created_to is not None:
        conditions.append(Task.created_at <= filters.created_to)

    return conditions


def _format_duration(
    started_at: Optional[datetime],
    completed_at: Optional[datetime],
) -> Optional[str]:
    if started_at is None:
        return None

    end = completed_at or datetime.utcnow()
    total_seconds = max(int((end - started_at).total_seconds()), 0)

    if total_seconds < 60:
        return f"{total_seconds}s"

    minutes, seconds = divmod(total_seconds, 60)
    if minutes < 60:
        return f"{minutes}m {seconds}s"

    hours, minutes = divmod(minutes, 60)
    return f"{hours}h {minutes}m"


def to_task_response(task: Task, team_name: Optional[str]) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        team_id=task.team_id,
        user_id=task.user_id,
        type=task.type,
        input=task.input,
        options=task.options,
        status=task.status,
        progress=task.progress,
        started_at=task.started_at,
        completed_at=task.completed_at,
        created_at=task.created_at,
        team_name=team_name or "",
        duration=_format_duration(task.started_at, task.completed_at),
    )


async def create_task(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    task_in: TaskCreate,
) -> Task:
    task = Task(
        team_id=team_id,
        user_id=user_id,
        type=task_in.type,
        input=task_in.input,
        options=task_in.options,
        status=TaskStatusEnum.PENDING.value,
        progress=0,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


def enqueue_task_execution(task_id: str) -> None:
    if os.getenv("PYTEST_CURRENT_TEST"):
        return

    try:
        celery_app.send_task(
            "app.workers.task_worker.execute_task",
            args=[task_id],
        )
    except Exception as exc:
        logger.warning("Failed to enqueue task %s: %s", task_id, exc)


async def list_tasks_by_user(
    db: AsyncSession,
    user_id: str,
    filters: TaskListFilters,
) -> Tuple[List[Tuple[Task, Optional[str]]], int]:
    conditions = _build_conditions(user_id, filters)

    count_result = await db.execute(select(func.count(Task.id)).where(*conditions))
    total = count_result.scalar_one()

    query = (
        select(Task, Team.name)
        .join(Team, Team.id == Task.team_id, isouter=True)
        .where(*conditions)
        .order_by(Task.created_at.desc())
        .offset((filters.page - 1) * filters.limit)
        .limit(filters.limit)
    )
    result = await db.execute(query)
    rows: List[Tuple[Task, Optional[str]]] = [
        (task, team_name) for task, team_name in result.all()
    ]

    return rows, total


async def get_task_with_team_name(
    db: AsyncSession,
    task_id: str,
) -> Optional[Tuple[Task, Optional[str]]]:
    result = await db.execute(
        select(Task, Team.name)
        .join(Team, Team.id == Task.team_id, isouter=True)
        .where(Task.id == task_id)
    )
    row = result.first()
    if row is None:
        return None
    task = row[0]
    team_name = row[1]
    return task, team_name


async def cancel_task(db: AsyncSession, task: Task) -> Task:
    terminal_statuses = {
        TaskStatusEnum.COMPLETED.value,
        TaskStatusEnum.FAILED.value,
        TaskStatusEnum.CANCELLED.value,
    }
    if task.status in terminal_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is already finished",
        )

    task.status = TaskStatusEnum.CANCELLED.value
    task.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)
    return task

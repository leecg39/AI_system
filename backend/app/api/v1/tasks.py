from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.models.task import TaskStatusEnum
from app.schemas.task import TaskCreate, TaskListFilters, TaskListResponse, TaskResponse
from app.services.task import (
    cancel_task,
    create_task,
    enqueue_task_execution,
    get_task_with_team_name,
    list_tasks_by_user,
    to_task_response,
    verify_team_ownership,
)

router = APIRouter(tags=["tasks"])


@router.post(
    "/teams/{team_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_endpoint(
    team_id: str,
    task_in: TaskCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    team = await verify_team_ownership(db, team_id, current_user)
    task = await create_task(db, team.id, current_user.id, task_in)
    enqueue_task_execution(task.id)
    return to_task_response(task, team.name)


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks_endpoint(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    team_id: Annotated[Optional[str], Query()] = None,
    task_status: Annotated[
        Optional[TaskStatusEnum], Query(alias="status")
    ] = None,
    task_type: Annotated[Optional[str], Query(alias="type")] = None,
    created_from: Annotated[Optional[datetime], Query()] = None,
    created_to: Annotated[Optional[datetime], Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    filters = TaskListFilters(
        team_id=team_id,
        status=task_status,
        type=task_type,
        created_from=created_from,
        created_to=created_to,
        page=page,
        limit=limit,
    )
    rows, total = await list_tasks_by_user(db, current_user.id, filters)
    tasks = [to_task_response(task, team_name) for task, team_name in rows]
    return TaskListResponse(tasks=tasks, total=total, page=page, limit=limit)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_endpoint(
    task_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    row = await get_task_with_team_name(db, task_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task, team_name = row
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task",
        )

    return to_task_response(task, team_name)


@router.put("/tasks/{task_id}/cancel", response_model=TaskResponse)
async def cancel_task_endpoint(
    task_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    row = await get_task_with_team_name(db, task_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task, team_name = row
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this task",
        )

    cancelled = await cancel_task(db, task)
    return to_task_response(cancelled, team_name)

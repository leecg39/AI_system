from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.task_result import TaskResultListResponse
from app.services.task import get_task_with_team_name
from app.services.task_result import (
    get_task_result,
    list_task_results,
    to_task_result_response,
)

router = APIRouter(tags=["task-results"])


@router.get("/tasks/{task_id}/results", response_model=TaskResultListResponse)
async def list_task_results_endpoint(
    task_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    result_type: Annotated[Optional[str], Query()] = None,
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

    results = await list_task_results(db, task_id, result_type=result_type)
    return TaskResultListResponse(
        results=[to_task_result_response(item) for item in results],
        total=len(results),
    )


@router.get("/tasks/{task_id}/results/{result_id}/download")
async def download_task_result_endpoint(
    task_id: str,
    result_id: str,
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

    task_result = await get_task_result(db, task_id=task_id, result_id=result_id)
    if task_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task result not found",
        )

    if task_result.file_url:
        return RedirectResponse(url=task_result.file_url)

    filename = f"task-result-{task_result.id}-v{task_result.version}.txt"
    return Response(
        content=task_result.content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

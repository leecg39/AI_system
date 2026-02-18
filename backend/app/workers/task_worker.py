import asyncio
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Protocol, Union

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.ws import stream_manager
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.agent import Agent
from app.models.task import Task, TaskStatusEnum
from app.models.task_log import TaskLog, TaskLogStatusEnum
from app.models.task_result import TaskResult
from app.services.ai_service import AIService

LAYER_ORDER = ["orchestration", "research", "execution", "quality"]


class AgentPromptRunner(Protocol):
    async def run_agent_prompt(
        self,
        agent_name: str,
        agent_role: str,
        model: Optional[str],
        prompt_template: Optional[str],
        task_type: str,
        input_data: dict[str, object],
        options: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        ...


def _layer_index(layer: str) -> int:
    if layer in LAYER_ORDER:
        return LAYER_ORDER.index(layer)
    return len(LAYER_ORDER)


async def _broadcast(task_id: str, payload: dict[str, object]) -> None:
    await stream_manager.broadcast(task_id, payload)


async def _append_log(
    session: AsyncSession,
    task_id: str,
    agent_id: str,
    status: str,
    message: str,
    progress: int,
) -> TaskLog:
    log = TaskLog(
        task_id=task_id,
        agent_id=agent_id,
        status=status,
        message=message,
        progress=progress,
        created_at=datetime.utcnow(),
    )
    session.add(log)
    await session.flush()
    return log


async def _get_next_version(
    session: AsyncSession,
    task_id: str,
    agent_id: str,
    result_type: str,
) -> int:
    result = await session.execute(
        select(func.max(TaskResult.version)).where(
            TaskResult.task_id == task_id,
            TaskResult.agent_id == agent_id,
            TaskResult.result_type == result_type,
        )
    )
    current = result.scalar_one_or_none()
    return (current or 0) + 1


async def _run_agent_inference(
    ai_service: AgentPromptRunner,
    task: Task,
    agent: Agent,
) -> Dict[str, object]:
    response = await ai_service.run_agent_prompt(
        agent_name=agent.name,
        agent_role=agent.role,
        model=agent.model,
        prompt_template=agent.prompt_template,
        task_type=task.type,
        input_data=task.input,
        options=task.options,
    )

    return {
        "agent_id": agent.id,
        "agent_name": agent.name,
        "model": str(response["model"]),
        "content": str(response["content"]),
        "usage": response.get("usage", {}),
    }


async def _persist_agent_success(
    session: AsyncSession,
    task: Task,
    agent: Agent,
    inference: Dict[str, object],
    progress: int,
) -> None:

    version = await _get_next_version(session, task.id, agent.id, task.type)
    task_result = TaskResult(
        task_id=task.id,
        agent_id=agent.id,
        result_type=task.type,
        content=str(inference["content"]),
        file_url=None,
        result_metadata={
            "agent_name": agent.name,
            "model": str(inference["model"]),
            "usage": inference.get("usage", {}),
        },
        quality_score=None,
        version=version,
        created_at=datetime.utcnow(),
    )
    session.add(task_result)

    await _append_log(
        session=session,
        task_id=task.id,
        agent_id=agent.id,
        status=TaskLogStatusEnum.COMPLETED.value,
        message=f"{agent.name} completed",
        progress=progress,
    )


def _group_agents_for_execution(agents: List[Agent], mode: str) -> List[List[Agent]]:
    sorted_agents = sorted(agents, key=lambda item: (_layer_index(item.layer), item.sort_order))
    if mode != "parallel":
        return [[agent] for agent in sorted_agents]

    grouped: dict[str, List[Agent]] = {}
    for agent in sorted_agents:
        grouped.setdefault(agent.layer, []).append(agent)

    ordered_groups: List[List[Agent]] = []
    seen_layers: set[str] = set()
    for layer in LAYER_ORDER:
        if layer in grouped:
            ordered_groups.append(grouped[layer])
            seen_layers.add(layer)

    for layer, layer_agents in grouped.items():
        if layer not in seen_layers:
            ordered_groups.append(layer_agents)

    return ordered_groups


async def execute_task_async(
    task_id: str,
    ai_service: Optional[AgentPromptRunner] = None,
    session_factory: Optional[Callable[[], Any]] = None,
) -> dict[str, object]:
    service = ai_service or AIService()
    factory = session_factory or AsyncSessionLocal

    async with factory() as session:
        task = await session.get(Task, task_id)
        if task is None:
            return {"status": "not_found", "task_id": task_id}

        if task.status == TaskStatusEnum.CANCELLED.value:
            return {"status": "cancelled", "task_id": task.id}

        task.status = TaskStatusEnum.RUNNING.value
        if task.started_at is None:
            task.started_at = datetime.utcnow()
        task.progress = 0
        await session.commit()

        await _broadcast(
            task.id,
            {
                "type": "progress_update",
                "task_id": task.id,
                "status": task.status,
                "progress": task.progress,
            },
        )

        agent_result = await session.execute(
            select(Agent).where(Agent.team_id == task.team_id)
        )
        agents = list(agent_result.scalars().all())

        if not agents:
            task.status = TaskStatusEnum.FAILED.value
            task.completed_at = datetime.utcnow()
            await session.commit()
            return {
                "status": "failed",
                "task_id": task.id,
                "reason": "No agents configured",
            }

        mode = str(task.options.get("execution_mode", "sequential"))
        groups = _group_agents_for_execution(agents, mode)

        completed_agents = 0
        total_agents = len(agents)

        for group in groups:
            await session.refresh(task)
            if task.status == TaskStatusEnum.CANCELLED.value:
                if task.completed_at is None:
                    task.completed_at = datetime.utcnow()
                    await session.commit()

                await _broadcast(
                    task.id,
                    {
                        "type": "progress_update",
                        "task_id": task.id,
                        "status": TaskStatusEnum.CANCELLED.value,
                        "progress": task.progress,
                    },
                )
                return {"status": "cancelled", "task_id": task.id}

            for agent in group:
                await _append_log(
                    session=session,
                    task_id=task.id,
                    agent_id=agent.id,
                    status=TaskLogStatusEnum.STARTED.value,
                    message=f"{agent.name} started",
                    progress=task.progress,
                )
            await session.commit()

            if len(group) == 1:
                agent = group[0]
                try:
                    results: List[Union[Dict[str, object], BaseException]] = [
                        await _run_agent_inference(service, task, agent)
                    ]
                except Exception as exc:
                    results = [exc]
            else:
                coroutines = [
                    _run_agent_inference(service, task, agent)
                    for agent in group
                ]
                gathered = await asyncio.gather(*coroutines, return_exceptions=True)
                results = []
                for gathered_item in gathered:
                    if isinstance(gathered_item, Exception):
                        results.append(gathered_item)
                    elif isinstance(gathered_item, dict):
                        results.append(gathered_item)
                    else:
                        results.append(RuntimeError("Invalid agent inference payload"))

            for agent, item in zip(group, results):
                if isinstance(item, BaseException):
                    await _append_log(
                        session=session,
                        task_id=task.id,
                        agent_id=agent.id,
                        status=TaskLogStatusEnum.ERROR.value,
                        message=str(item),
                        progress=task.progress,
                    )
                    task.status = TaskStatusEnum.FAILED.value
                    task.completed_at = datetime.utcnow()
                    await session.commit()
                    await _broadcast(
                        task.id,
                        {
                            "type": "progress_update",
                            "task_id": task.id,
                            "status": task.status,
                            "progress": task.progress,
                            "error": str(item),
                        },
                    )
                    return {"status": "failed", "task_id": task.id, "error": str(item)}

                item_data = item

                completed_agents += 1
                task.progress = int((completed_agents / total_agents) * 100)
                await _persist_agent_success(
                    session=session,
                    task=task,
                    agent=agent,
                    inference=item_data,
                    progress=task.progress,
                )
                await session.commit()
                await _broadcast(
                    task.id,
                    {
                        "type": "agent_update",
                        "task_id": task.id,
                        "agent_id": str(item_data["agent_id"]),
                        "status": TaskLogStatusEnum.COMPLETED.value,
                        "progress": task.progress,
                    },
                )

            await _broadcast(
                task.id,
                {
                    "type": "progress_update",
                    "task_id": task.id,
                    "status": task.status,
                    "progress": task.progress,
                },
            )

        task.status = TaskStatusEnum.COMPLETED.value
        task.progress = 100
        task.completed_at = datetime.utcnow()
        await session.commit()

        await _broadcast(
            task.id,
            {
                "type": "progress_update",
                "task_id": task.id,
                "status": task.status,
                "progress": task.progress,
            },
        )

        return {
            "status": "completed",
            "task_id": task.id,
            "processed_agents": completed_agents,
        }


@celery_app.task(name="app.workers.task_worker.execute_task")
def execute_task(task_id: str) -> dict[str, object]:
    return asyncio.run(execute_task_async(task_id=task_id))

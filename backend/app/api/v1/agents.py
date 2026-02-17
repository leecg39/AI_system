# @TASK P2-R2-T1 - Agents API endpoints
# @SPEC docs/planning/02-trd.md#agents-api
"""Agents CRUD endpoints for managing AI agents within teams."""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.agent import (
    AgentCreate,
    AgentListResponse,
    AgentResponse,
    AgentUpdate,
)
from app.services.agent import (
    create_agent,
    delete_agent,
    list_agents,
    update_agent,
)

router = APIRouter(tags=["agents"])


@router.post(
    "/teams/{team_id}/agents",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent_endpoint(
    team_id: str,
    agent_in: AgentCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new agent in a team."""
    agent = await create_agent(db, team_id, agent_in, current_user)
    return agent


@router.get(
    "/teams/{team_id}/agents",
    response_model=AgentListResponse,
)
async def list_agents_endpoint(
    team_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all agents in a team, sorted by sort_order."""
    agents = await list_agents(db, team_id, current_user)
    return AgentListResponse(agents=agents, total=len(agents))


@router.put(
    "/agents/{agent_id}",
    response_model=AgentResponse,
)
async def update_agent_endpoint(
    agent_id: str,
    agent_in: AgentUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing agent."""
    agent = await update_agent(db, agent_id, agent_in, current_user)
    return agent


@router.delete(
    "/agents/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_agent_endpoint(
    agent_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an agent."""
    await delete_agent(db, agent_id, current_user)

# @TASK P2-R2-T1 - Agent service for CRUD operations
# @SPEC docs/planning/02-trd.md#agents-api
"""Agent service layer handling business logic and data access."""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentStatusEnum, ModelEnum
from app.models.team import Team
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentUpdate


async def verify_team_ownership(
    db: AsyncSession, team_id: str, current_user: User
) -> Team:
    """Verify the team exists and belongs to the current user.

    Returns the Team if valid, raises HTTPException otherwise.
    """
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


async def create_agent(
    db: AsyncSession, team_id: str, agent_in: AgentCreate, current_user: User
) -> Agent:
    """Create a new agent in the specified team."""
    await verify_team_ownership(db, team_id, current_user)

    agent = Agent(
        team_id=team_id,
        name=agent_in.name,
        role=agent_in.role,
        layer=agent_in.layer.value,
        model=agent_in.model.value if agent_in.model else ModelEnum.SONNET.value,
        prompt_template=agent_in.prompt_template,
        tools=agent_in.tools if agent_in.tools is not None else [],
        sort_order=agent_in.sort_order if agent_in.sort_order is not None else 0,
        status=AgentStatusEnum.IDLE.value,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def list_agents(
    db: AsyncSession, team_id: str, current_user: User
) -> List[Agent]:
    """List all agents for a team, sorted by sort_order."""
    await verify_team_ownership(db, team_id, current_user)

    result = await db.execute(
        select(Agent)
        .where(Agent.team_id == team_id)
        .order_by(Agent.sort_order.asc())
    )
    return list(result.scalars().all())


async def get_agent_with_ownership(
    db: AsyncSession, agent_id: str, current_user: User
) -> Agent:
    """Get an agent and verify the current user owns its team.

    Returns the Agent if valid, raises HTTPException otherwise.
    """
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Verify team ownership
    await verify_team_ownership(db, agent.team_id, current_user)

    return agent


async def update_agent(
    db: AsyncSession, agent_id: str, agent_in: AgentUpdate, current_user: User
) -> Agent:
    """Update an existing agent."""
    agent = await get_agent_with_ownership(db, agent_id, current_user)

    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "layer" and value is not None:
            setattr(agent, field, value.value)
        elif field == "model" and value is not None:
            setattr(agent, field, value.value)
        elif field == "status" and value is not None:
            setattr(agent, field, value.value)
        else:
            setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


async def delete_agent(
    db: AsyncSession, agent_id: str, current_user: User
) -> None:
    """Delete an agent."""
    agent = await get_agent_with_ownership(db, agent_id, current_user)

    await db.delete(agent)
    await db.commit()

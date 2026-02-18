# @TASK P2-R1-T1 - Team service (CRUD + computed fields)
# @SPEC docs/planning/02-trd.md#teams-api
"""Team service layer for CRUD operations and computed fields."""
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.task import Task
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate


async def create_team(
    db: AsyncSession, user_id: str, team_in: TeamCreate
) -> Team:
    """Create a new team for the given user."""
    team = Team(
        user_id=user_id,
        name=team_in.name,
        description=team_in.description,
        template_id=team_in.template_id,
        config=team_in.config if team_in.config is not None else {},
        status="active",
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


async def list_teams_by_user(
    db: AsyncSession, user_id: str
) -> List[Team]:
    """Return all teams owned by the given user."""
    result = await db.execute(
        select(Team)
        .where(Team.user_id == user_id)
        .order_by(Team.created_at.desc())
    )
    return list(result.scalars().all())


async def get_team_by_id(
    db: AsyncSession, team_id: str
) -> Optional[Team]:
    """Return a team by its ID, or None if not found."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    return result.scalar_one_or_none()


async def update_team(
    db: AsyncSession, team: Team, team_in: TeamUpdate
) -> Team:
    """Apply partial updates to a team."""
    update_data = team_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value is not None:
            # Store the enum value string
            setattr(team, field, value.value if hasattr(value, "value") else value)
        else:
            setattr(team, field, value)
    await db.commit()
    await db.refresh(team)
    return team


async def delete_team(db: AsyncSession, team: Team) -> None:
    """Delete a team."""
    await db.delete(team)
    await db.commit()


async def get_agent_count(db: AsyncSession, team_id: str) -> int:
    """Count the number of agents belonging to a team."""
    result = await db.execute(
        select(func.count(Agent.id)).where(Agent.team_id == team_id)
    )
    return result.scalar_one()


async def get_recent_task_count(db: AsyncSession, team_id: str) -> int:
    """Count tasks created for the team in the last 24 hours."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    result = await db.execute(
        select(func.count(Task.id)).where(
            Task.team_id == team_id,
            Task.created_at >= cutoff,
        )
    )
    return result.scalar_one()

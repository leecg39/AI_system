# @TASK P2-R1-T1 - Teams API endpoints
# @SPEC docs/planning/02-trd.md#teams-api
"""Teams CRUD endpoints with JWT authentication."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.team import (
    TeamCreate,
    TeamListResponse,
    TeamResponse,
    TeamUpdate,
)
from app.services.team import (
    create_team,
    delete_team,
    get_agent_count,
    get_recent_task_count,
    get_team_by_id,
    list_teams_by_user,
    update_team,
)

router = APIRouter(prefix="/teams", tags=["teams"])


async def _enrich_team_response(
    db: AsyncSession, team
) -> dict:
    """Build a TeamResponse dict with computed agent_count and recent_task_count."""
    agent_count = await get_agent_count(db, team.id)
    recent_task_count = await get_recent_task_count(db, team.id)
    return TeamResponse(
        id=team.id,
        user_id=team.user_id,
        name=team.name,
        description=team.description,
        template_id=team.template_id,
        config=team.config,
        status=team.status,
        agent_count=agent_count,
        recent_task_count=recent_task_count,
        created_at=team.created_at,
        updated_at=team.updated_at,
    )


# @TASK P2-R1-T1.1 - Create Team
@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team_endpoint(
    team_in: TeamCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new team for the authenticated user."""
    team = await create_team(db, current_user.id, team_in)
    return await _enrich_team_response(db, team)


# @TASK P2-R1-T1.2 - List Teams
@router.get("", response_model=TeamListResponse)
async def list_teams_endpoint(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all teams for the authenticated user."""
    teams = await list_teams_by_user(db, current_user.id)
    enriched = [await _enrich_team_response(db, t) for t in teams]
    return TeamListResponse(teams=enriched, total=len(enriched))


# @TASK P2-R1-T1.3 - Get Team
@router.get("/{team_id}", response_model=TeamResponse)
async def get_team_endpoint(
    team_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific team by ID (must be owned by the current user)."""
    team = await get_team_by_id(db, team_id)
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
    return await _enrich_team_response(db, team)


# @TASK P2-R1-T1.4 - Update Team
@router.put("/{team_id}", response_model=TeamResponse)
async def update_team_endpoint(
    team_id: str,
    team_in: TeamUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a team (must be owned by the current user)."""
    team = await get_team_by_id(db, team_id)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    if team.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this team",
        )
    updated = await update_team(db, team, team_in)
    return await _enrich_team_response(db, updated)


# @TASK P2-R1-T1.5 - Delete Team
@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team_endpoint(
    team_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a team (must be owned by the current user)."""
    team = await get_team_by_id(db, team_id)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    if team.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this team",
        )
    await delete_team(db, team)

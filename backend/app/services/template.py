# @TASK P2-R3-T1 - Team Template service layer
# @SPEC docs/planning/02-trd.md#team-templates
"""Team Template service for database operations."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_template import TeamTemplate


async def list_templates(
    db: AsyncSession,
    category: Optional[str] = None,
) -> List[TeamTemplate]:
    """List active team templates, optionally filtered by category.

    Args:
        db: Async database session.
        category: Optional category to filter by.

    Returns:
        List of active TeamTemplate instances.
    """
    query = select(TeamTemplate).where(TeamTemplate.is_active == True)  # noqa: E712

    if category is not None:
        query = query.where(TeamTemplate.category == category)

    query = query.order_by(TeamTemplate.created_at)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_template(
    db: AsyncSession,
    template_id: str,
) -> Optional[TeamTemplate]:
    """Get a single team template by ID.

    Args:
        db: Async database session.
        template_id: UUID string of the template.

    Returns:
        TeamTemplate instance or None if not found.
    """
    result = await db.execute(
        select(TeamTemplate).where(TeamTemplate.id == template_id)
    )
    return result.scalar_one_or_none()

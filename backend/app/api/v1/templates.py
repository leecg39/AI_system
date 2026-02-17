# @TASK P2-R3-T1 - Team Templates API endpoints
# @SPEC docs/planning/02-trd.md#team-templates
"""Team Templates endpoints - public API (no authentication required)."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.template import TemplateListResponse, TemplateResponse
from app.services.template import list_templates

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=TemplateListResponse)
async def get_templates(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: Optional[str] = Query(default=None, description="Filter by template category"),
):
    """List all active team templates.

    Optionally filter by category. No authentication required.
    """
    templates = await list_templates(db, category=category)
    return TemplateListResponse(
        templates=[TemplateResponse.model_validate(t) for t in templates],
        total=len(templates),
    )

# @TASK P0-T0.4 - Database initialization: team_templates table
# @SPEC docs/planning/04-database-design.md#team-templates-table
"""TeamTemplate model for pre-defined team configurations."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import uuid


class TeamTemplate(Base):
    """TeamTemplate model for pre-configured team templates."""
    __tablename__ = "team_templates"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    default_agents: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

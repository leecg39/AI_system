# @TASK P0-T0.4 - Database initialization: teams table
# @SPEC docs/planning/04-database-design.md#teams-table
"""Team model for multi-agent team organization."""
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid


class TeamStatusEnum(str, Enum):
    """Team status types."""
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class Team(Base):
    """Team model for organizing multi-agent systems."""
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    template_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("team_templates.id"), nullable=True
    )
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default=TeamStatusEnum.ACTIVE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    agents: Mapped[list["Agent"]] = relationship(
        "Agent", back_populates="team", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="team"
    )

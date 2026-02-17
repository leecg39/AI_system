# @TASK P0-T0.4 - Database initialization: agents table
# @SPEC docs/planning/04-database-design.md#agents-table
"""Agent model for multi-agent system."""
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid


class LayerEnum(str, Enum):
    """Agent layer types."""
    ORCHESTRATION = "orchestration"
    RESEARCH = "research"
    EXECUTION = "execution"
    QUALITY = "quality"


class ModelEnum(str, Enum):
    """Claude model types."""
    OPUS = "opus"
    SONNET = "sonnet"
    HAIKU = "haiku"


class AgentStatusEnum(str, Enum):
    """Agent status types."""
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"


class Agent(Base):
    """Agent model for individual AI agents in a team."""
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    team_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("teams.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    layer: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), default=ModelEnum.SONNET, nullable=False)
    prompt_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tools: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default=AgentStatusEnum.IDLE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    team: Mapped["Team"] = relationship("Team", back_populates="agents")
    task_results: Mapped[list["TaskResult"]] = relationship(
        "TaskResult", back_populates="agent"
    )
    task_logs: Mapped[list["TaskLog"]] = relationship(
        "TaskLog", back_populates="agent"
    )

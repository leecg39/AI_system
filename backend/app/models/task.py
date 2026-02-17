# @TASK P0-T0.4 - Database initialization: tasks table
# @SPEC docs/planning/04-database-design.md#tasks-table
"""Task model for tracking work assigned to agent teams."""
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid


class TaskStatusEnum(str, Enum):
    """Task status types."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Task(Base):
    """Task model for tracking work in the system."""
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    team_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("teams.id"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(255), nullable=False)
    input: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    options: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default=TaskStatusEnum.PENDING, nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    team: Mapped["Team"] = relationship("Team", back_populates="tasks")
    results: Mapped[list["TaskResult"]] = relationship(
        "TaskResult", back_populates="task", cascade="all, delete-orphan"
    )
    logs: Mapped[list["TaskLog"]] = relationship(
        "TaskLog", back_populates="task", cascade="all, delete-orphan"
    )

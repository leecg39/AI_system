# @TASK P0-T0.4 - Database initialization: task_logs table
# @SPEC docs/planning/04-database-design.md#task-logs-table
"""TaskLog model for tracking task execution logs."""
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid


class TaskLogStatusEnum(str, Enum):
    """Task log status types."""
    STARTED = "started"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"


class TaskLog(Base):
    """TaskLog model for tracking detailed execution logs."""
    __tablename__ = "task_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id"), index=True, nullable=False
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="logs")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="task_logs")

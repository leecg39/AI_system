# @TASK P0-T0.4 - Database initialization: task_results table
# @SPEC docs/planning/04-database-design.md#task-results-table
"""TaskResult model for storing results from agent executions."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import uuid


class TaskResult(Base):
    """TaskResult model for storing output from agent executions."""
    __tablename__ = "task_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id"), index=True, nullable=False
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), index=True, nullable=False
    )
    result_type: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    result_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="results")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="task_results")

"""
Summary model.

One-to-one with Meeting. Keeps generation metadata so we can track
whether a summary was produced by a mock generator or a real LLM,
and which model was used.
"""

from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship

from app.core.db import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    overview = Column(String, nullable=True)
    # 'mock' | 'llm'
    generated_by = Column(String, default="mock", nullable=False)
    model_name = Column(String, nullable=True)
    generated_at = Column(TIMESTAMP, nullable=True)
    # 'pending' | 'ready' | 'failed'
    status = Column(String, default="pending", nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="summary")

    def __repr__(self) -> str:
        return f"<Summary id={self.id!r} meeting={self.meeting_id!r} status={self.status!r}>"

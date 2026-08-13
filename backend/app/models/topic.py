"""
Topic model.

Represents a chapter / outline section of a meeting. Each topic has an
optional start_ms to enable jump-to-chapter functionality in the media player.
"""

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String, nullable=False)
    # Millisecond offset for jump-to-chapter; nullable if unknown
    start_ms = Column(Integer, nullable=True)
    sequence_index = Column(Integer, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="topics")

    def __repr__(self) -> str:
        return f"<Topic id={self.id!r} title={self.title!r} seq={self.sequence_index}>"

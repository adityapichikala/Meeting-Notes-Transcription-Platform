"""
ActionItem model.

Represents a task extracted from the meeting transcript.
Links back to the source transcript segment for traceability.
"""

from sqlalchemy import Column, String, Boolean, Date, TIMESTAMP, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.db import Base


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    text = Column(String, nullable=False)
    assignee_id = Column(
        String,
        ForeignKey("participants.id"),
        nullable=True,
    )
    due_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    # Traceability: which transcript line generated this action item?
    source_segment_id = Column(
        String,
        ForeignKey("transcript_segments.id"),
        nullable=True,
    )
    created_at = Column(
        TIMESTAMP,
        server_default="CURRENT_TIMESTAMP",
        nullable=False,
    )
    version = Column(Integer, default=1, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship(
        "Participant",
        back_populates="action_items",
        foreign_keys=[assignee_id],
    )
    source_segment = relationship(
        "TranscriptSegment",
        back_populates="action_items",
        foreign_keys=[source_segment_id],
    )

    def __repr__(self) -> str:
        return f"<ActionItem id={self.id!r} text={self.text[:40]!r}>"

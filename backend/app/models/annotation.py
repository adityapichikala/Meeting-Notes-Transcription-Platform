"""
Annotation model.

Covers comments, highlights, and soundbites on transcript segments.
type: 'comment' | 'highlight' | 'soundbite'
"""

from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship

from app.core.db import Base


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    segment_id = Column(
        String,
        ForeignKey("transcript_segments.id", ondelete="CASCADE"),
        nullable=True,
    )
    author_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=True,
    )
    # 'comment' | 'highlight' | 'soundbite'
    type = Column(String, nullable=False)
    body = Column(String, nullable=True)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="annotations")
    segment = relationship("TranscriptSegment", back_populates="annotations")
    author = relationship("User", back_populates="annotations")

    def __repr__(self) -> str:
        return f"<Annotation id={self.id!r} type={self.type!r}>"

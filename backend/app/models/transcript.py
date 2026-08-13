"""
TranscriptSegment model.

The core entity — one row per spoken line (diarized speaker turn).
Indexed for meeting-scoped ordering and timestamp-based player sync.

The FTS5 virtual table (transcript_segments_fts) is NOT a SQLAlchemy model
because SQLite virtual tables cannot be expressed as ORM declarative classes.
It is created and maintained via raw DDL in the Alembic migration.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.db import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    speaker_id = Column(
        String,
        ForeignKey("speakers.id"),
        nullable=True,
    )
    # Explicit ordering (do not rely on insertion order)
    sequence_index = Column(Integer, nullable=False)
    # Millisecond offsets for media player sync
    start_ms = Column(Integer, nullable=False)
    end_ms = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default="CURRENT_TIMESTAMP",
        nullable=False,
    )


    # ── Composite indexes (from SQL schema) ───────────────────────────────────
    __table_args__ = (
        # Primary query pattern: all segments for a meeting, ordered
        Index("idx_segments_meeting", "meeting_id", "sequence_index"),
        # Secondary query pattern: seek to a timestamp for player sync
        Index("idx_segments_time", "meeting_id", "start_ms"),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="transcript_segments")
    speaker = relationship("Speaker", back_populates="transcript_segments")
    action_items = relationship(
        "ActionItem",
        back_populates="source_segment",
        foreign_keys="ActionItem.source_segment_id",
    )
    annotations = relationship("Annotation", back_populates="segment")

    def __repr__(self) -> str:
        return (
            f"<TranscriptSegment id={self.id!r} seq={self.sequence_index} "
            f"start={self.start_ms}ms>"
        )

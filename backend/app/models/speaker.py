"""
Speaker model.

Speakers are derived from transcript diarization labels — they are NOT the
same as Participants. A speaker label ("Speaker 1") may later be resolved to
a participant name but the two entities remain separate.
"""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(String, primary_key=True)
    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    # e.g. "Speaker 1" or a resolved name
    label = Column(String, nullable=False)
    color_hex = Column(String, default="#6C5CE7", nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="speakers")
    transcript_segments = relationship(
        "TranscriptSegment", back_populates="speaker"
    )

    def __repr__(self) -> str:
        return f"<Speaker id={self.id!r} label={self.label!r}>"

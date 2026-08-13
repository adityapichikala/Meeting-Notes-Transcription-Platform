"""
Meeting model.

Central entity of the system. Owns transcript segments, summary, topics,
action items, participants, speakers, tags, and annotations via cascade.
"""

from sqlalchemy import Column, String, Integer, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship

from app.core.db import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    meeting_date = Column(TIMESTAMP, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    media_url = Column(String, nullable=True)
    # 'audio' | 'video'
    media_type = Column(String, default="audio", nullable=False)
    # 'processing' | 'ready' | 'failed'
    status = Column(String, default="ready", nullable=False)
    # 'upload' | 'paste' | 'seed'
    source = Column(String, default="upload", nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    owner = relationship("User", back_populates="meetings")

    meeting_participants = relationship(
        "MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan"
    )
    speakers = relationship(
        "Speaker", back_populates="meeting", cascade="all, delete-orphan"
    )
    transcript_segments = relationship(
        "TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan",
        order_by="TranscriptSegment.sequence_index",
    )
    summary = relationship(
        "Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan"
    )
    topics = relationship(
        "Topic", back_populates="meeting", cascade="all, delete-orphan",
        order_by="Topic.sequence_index",
    )
    action_items = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan"
    )
    meeting_tags = relationship(
        "MeetingTag", back_populates="meeting", cascade="all, delete-orphan"
    )
    annotations = relationship(
        "Annotation", back_populates="meeting", cascade="all, delete-orphan"
    )

    @property
    def participants(self):
        return [mp.participant_id for mp in self.meeting_participants]
        
    @property
    def tags(self):
        return [mt.tag.name for mt in self.meeting_tags if mt.tag]

    def __repr__(self) -> str:
        return f"<Meeting id={self.id!r} title={self.title!r}>"


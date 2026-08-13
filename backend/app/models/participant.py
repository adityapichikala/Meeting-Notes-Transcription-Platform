"""
Participant and MeetingParticipant (junction table) models.

Participants are distinct from Speakers: a participant is a known person
invited to the meeting; a speaker is a diarization label derived from audio.
"""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting_participants = relationship(
        "MeetingParticipant", back_populates="participant"
    )
    action_items = relationship(
        "ActionItem", back_populates="assignee", foreign_keys="ActionItem.assignee_id"
    )

    def __repr__(self) -> str:
        return f"<Participant id={self.id!r} name={self.name!r}>"


class MeetingParticipant(Base):
    """
    Many-to-many junction between meetings and participants.
    role: 'host' | 'attendee'
    """

    __tablename__ = "meeting_participants"

    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    participant_id = Column(
        String,
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    # 'host' | 'attendee'
    role = Column(String, default="attendee", nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="meeting_participants")
    participant = relationship("Participant", back_populates="meeting_participants")

    def __repr__(self) -> str:
        return (
            f"<MeetingParticipant meeting={self.meeting_id!r} "
            f"participant={self.participant_id!r} role={self.role!r}>"
        )

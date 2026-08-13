"""
Tag and MeetingTag (junction table) models.

Tags are global entities (unique by name); MeetingTag links them to meetings.
"""

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting_tags = relationship("MeetingTag", back_populates="tag")

    def __repr__(self) -> str:
        return f"<Tag id={self.id!r} name={self.name!r}>"


class MeetingTag(Base):
    """Many-to-many junction between meetings and tags."""

    __tablename__ = "meeting_tags"

    meeting_id = Column(
        String,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    tag_id = Column(
        String,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    meeting = relationship("Meeting", back_populates="meeting_tags")
    tag = relationship("Tag", back_populates="meeting_tags")

    def __repr__(self) -> str:
        return f"<MeetingTag meeting={self.meeting_id!r} tag={self.tag_id!r}>"

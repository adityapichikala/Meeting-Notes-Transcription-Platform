"""
SQLAlchemy ORM models — re-exported from submodules.

Import order matters for relationship resolution: parents before children.
"""

from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant, MeetingParticipant
from app.models.speaker import Speaker
from app.models.transcript import TranscriptSegment
from app.models.summary import Summary
from app.models.topic import Topic
from app.models.action_item import ActionItem
from app.models.tag import Tag, MeetingTag
from app.models.annotation import Annotation

__all__ = [
    "User",
    "Meeting",
    "Participant",
    "MeetingParticipant",
    "Speaker",
    "TranscriptSegment",
    "Summary",
    "Topic",
    "ActionItem",
    "Tag",
    "MeetingTag",
    "Annotation",
]

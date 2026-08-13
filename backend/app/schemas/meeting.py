from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MeetingParticipantSchema(BaseModel):
    participant_id: str
    role: str

class MeetingTagSchema(BaseModel):
    tag_id: str

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_date: datetime
    duration_seconds: int = 0
    participants: Optional[List[str]] = Field(default_factory=list) # List of participant IDs
    tags: Optional[List[str]] = Field(default_factory=list) # List of tag IDs

class MeetingCreateJSON(MeetingBase):
    pass

class MeetingCreateRaw(MeetingBase):
    raw_transcript: str

class MeetingResponse(MeetingBase):
    id: str
    owner_id: str
    media_url: Optional[str] = None
    media_type: str
    status: str
    source: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MeetingListResponse(BaseModel):
    items: List[MeetingResponse]
    total: int
    offset: int
    limit: int

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    participants: Optional[List[str]] = None
    tags: Optional[List[str]] = None

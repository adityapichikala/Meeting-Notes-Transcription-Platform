from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TopicBase(BaseModel):
    title: str
    start_ms: Optional[int] = None
    sequence_index: int


class TopicResponse(TopicBase):
    id: str
    meeting_id: str
    
    class ConfigDict:
        from_attributes = True


class SummaryBase(BaseModel):
    overview: Optional[str] = None
    status: str


class SummaryResponse(SummaryBase):
    id: str
    meeting_id: str
    generated_by: str
    model_name: Optional[str] = None
    generated_at: Optional[datetime] = None
    
    class ConfigDict:
        from_attributes = True

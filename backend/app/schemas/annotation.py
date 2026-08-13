from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AnnotationBase(BaseModel):
    segment_id: Optional[str] = None
    type: str
    body: Optional[str] = None

class AnnotationCreate(AnnotationBase):
    pass

class AnnotationResponse(AnnotationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    meeting_id: str
    author_id: Optional[str] = None
    created_at: datetime

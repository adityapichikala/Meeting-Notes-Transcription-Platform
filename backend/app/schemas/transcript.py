from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TranscriptSegmentBase(BaseModel):
    sequence_index: int
    start_ms: int
    end_ms: int
    text: str

class TranscriptSegmentCreate(TranscriptSegmentBase):
    speaker_label: Optional[str] = None

class TranscriptSegmentResponse(TranscriptSegmentBase):
    id: str
    meeting_id: str
    speaker_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class FTSSearchResult(BaseModel):
    segment_id: str
    highlighted_text: str

class TranscriptSearchResponse(BaseModel):
    results: List[FTSSearchResult]

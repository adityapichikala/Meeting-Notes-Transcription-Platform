from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActionItemBase(BaseModel):
    text: str
    assignee_id: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: bool = False
    source_segment_id: Optional[str] = None


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None
    source_segment_id: Optional[str] = None
    version: int


class ActionItemResponse(ActionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    created_at: datetime
    version: int

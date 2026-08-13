from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.repositories import action_item_repo, meeting_repo
from app.schemas.action_item import ActionItemCreate, ActionItemResponse, ActionItemUpdate

router = APIRouter(prefix="/api/v1", tags=["action_items"])

@router.get("/meetings/{meeting_id}/action-items", response_model=List[ActionItemResponse])
def get_action_items(meeting_id: str, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return action_item_repo.get_action_items_by_meeting(db, meeting_id)

@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemResponse)
def create_action_item(meeting_id: str, data: ActionItemCreate, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return action_item_repo.create_action_item(db, meeting_id, data)

@router.patch("/action-items/{item_id}", response_model=ActionItemResponse)
def update_action_item(item_id: str, data: ActionItemUpdate, db: Session = Depends(get_db)):
    item = action_item_repo.update_action_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    return item

@router.delete("/action-items/{item_id}")
def delete_action_item(item_id: str, db: Session = Depends(get_db)):
    success = action_item_repo.delete_action_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Action item not found")
    return {"status": "deleted"}

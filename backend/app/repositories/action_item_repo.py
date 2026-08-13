import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import ActionItem
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate


def get_action_items_by_meeting(db: Session, meeting_id: str) -> List[ActionItem]:
    return db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()


def get_action_item(db: Session, item_id: str) -> Optional[ActionItem]:
    return db.query(ActionItem).filter(ActionItem.id == item_id).first()


def create_action_item(db: Session, meeting_id: str, data: ActionItemCreate) -> ActionItem:
    item = ActionItem(
        id=str(uuid.uuid4()),
        meeting_id=meeting_id,
        text=data.text,
        assignee_id=data.assignee_id,
        due_date=data.due_date,
        is_completed=data.is_completed,
        source_segment_id=data.source_segment_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_action_item(db: Session, item_id: str, data: ActionItemUpdate) -> Optional[ActionItem]:
    from fastapi import HTTPException
    
    item = get_action_item(db, item_id)
    if not item:
        return None
        
    if item.version != data.version:
        raise HTTPException(status_code=409, detail="Conflict: ActionItem was updated by another request.")
        
    update_data = data.model_dump(exclude_unset=True, exclude={"version"})
    for key, value in update_data.items():
        setattr(item, key, value)
        
    item.version += 1
    db.commit()
    db.refresh(item)
    return item


def delete_action_item(db: Session, item_id: str) -> bool:
    item = get_action_item(db, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True

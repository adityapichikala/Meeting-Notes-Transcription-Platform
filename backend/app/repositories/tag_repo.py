from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.tag import Tag, MeetingTag
import uuid

def get_all_tags(db: Session) -> List[Tag]:
    return db.query(Tag).all()

def get_tag_by_name(db: Session, name: str) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.name == name).first()

def create_tag(db: Session, name: str) -> Tag:
    tag = Tag(id=str(uuid.uuid4()), name=name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

def add_tag_to_meeting(db: Session, meeting_id: str, tag_name: str) -> Tag:
    tag = get_tag_by_name(db, tag_name)
    if not tag:
        tag = create_tag(db, tag_name)
        
    # Check if junction exists
    existing = db.query(MeetingTag).filter(
        MeetingTag.meeting_id == meeting_id,
        MeetingTag.tag_id == tag.id
    ).first()
    
    if not existing:
        mt = MeetingTag(meeting_id=meeting_id, tag_id=tag.id)
        db.add(mt)
        db.commit()
        
    return tag

def remove_tag_from_meeting(db: Session, meeting_id: str, tag_id: str) -> bool:
    mt = db.query(MeetingTag).filter(
        MeetingTag.meeting_id == meeting_id,
        MeetingTag.tag_id == tag_id
    ).first()
    if not mt:
        return False
    db.delete(mt)
    db.commit()
    return True

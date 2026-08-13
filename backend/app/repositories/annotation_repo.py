import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate

def get_annotations_by_meeting(db: Session, meeting_id: str) -> List[Annotation]:
    return db.query(Annotation).filter(Annotation.meeting_id == meeting_id).all()

def create_annotation(db: Session, meeting_id: str, author_id: str, data: AnnotationCreate) -> Annotation:
    item = Annotation(
        id=str(uuid.uuid4()),
        meeting_id=meeting_id,
        segment_id=data.segment_id,
        author_id=author_id,
        type=data.type,
        body=data.body
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def delete_annotation(db: Session, annotation_id: str) -> bool:
    item = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True

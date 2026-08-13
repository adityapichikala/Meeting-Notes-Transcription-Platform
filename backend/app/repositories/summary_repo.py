from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import Summary, Topic


def get_summary(db: Session, meeting_id: str) -> Optional[Summary]:
    return db.query(Summary).filter(Summary.meeting_id == meeting_id).first()


def get_topics(db: Session, meeting_id: str) -> List[Topic]:
    return db.query(Topic).filter(Topic.meeting_id == meeting_id).order_by(Topic.sequence_index.asc()).all()

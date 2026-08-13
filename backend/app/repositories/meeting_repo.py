import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session

from app.models import Meeting, MeetingParticipant, Participant
from app.schemas.meeting import MeetingCreateJSON, MeetingCreateRaw, MeetingUpdate

def create_meeting(db: Session, owner_id: str, data: MeetingCreateJSON, source: str, media_type: str = "text") -> Meeting:
    meeting_id = str(uuid.uuid4())
    
    meeting = Meeting(
        id=meeting_id,
        owner_id=owner_id,
        title=data.title,
        description=data.description,
        meeting_date=data.meeting_date,
        duration_seconds=data.duration_seconds,
        status="processing",
        source=source,
        media_type=media_type,
    )
    db.add(meeting)
    
    if data.participants:
        for p_id in data.participants:
            mp = MeetingParticipant(
                meeting_id=meeting_id,
                participant_id=p_id,
                role="attendee"
            )
            db.add(mp)
            
    db.commit()
    db.refresh(meeting)
    return meeting

def get_meeting(db: Session, meeting_id: str) -> Optional[Meeting]:
    return db.query(Meeting).filter(Meeting.id == meeting_id).first()

def list_meetings(
    db: Session,
    owner_id: str,
    q: Optional[str] = None,
    participant_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Meeting], int]:
    
    query = select(Meeting).where(Meeting.owner_id == owner_id)
    
    if q:
        search_term = f"%{q}%"
        query = query.outerjoin(Meeting.meeting_participants).outerjoin(MeetingParticipant.participant).where(
            or_(
                Meeting.title.ilike(search_term),
                Participant.name.ilike(search_term)
            )
        )
        
    if participant_id:
        query = query.outerjoin(Meeting.meeting_participants).where(MeetingParticipant.participant_id == participant_id)
        
    if start_date:
        query = query.where(Meeting.meeting_date >= start_date)
    if end_date:
        query = query.where(Meeting.meeting_date <= end_date)
        
    # Count total
    total = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0
    
    # Pagination & ordering
    query = query.order_by(Meeting.meeting_date.desc()).offset(offset).limit(limit)
    
    meetings = db.execute(query).scalars().all()
    # If the join was made, we might get duplicates, so use unique() in execution
    # For now, scalars() over a flat select might yield duplicates if joined. 
    # Let's use distinct
    if q or participant_id:
        query = query.distinct()
        meetings = db.execute(query).scalars().all()
        
    return list(meetings), total

def update_meeting(db: Session, meeting_id: str, data: MeetingUpdate) -> Optional[Meeting]:
    meeting = get_meeting(db, meeting_id)
    if not meeting:
        return None
        
    update_data = data.model_dump(exclude_unset=True)
    
    # Handle simple fields
    for key in ["title", "description"]:
        if key in update_data:
            setattr(meeting, key, update_data[key])
            
    # Participants and tags could be handled here if requested
    # We will just focus on title and description for this basic update for now
            
    db.commit()
    db.refresh(meeting)
    return meeting

def delete_meeting(db: Session, meeting_id: str) -> bool:
    meeting = get_meeting(db, meeting_id)
    if not meeting:
        return False
        
    db.delete(meeting)
    db.commit()
    return True

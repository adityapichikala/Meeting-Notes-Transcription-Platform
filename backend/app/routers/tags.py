from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.repositories import tag_repo, meeting_repo
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["tags"])

class TagResponse(BaseModel):
    id: str
    name: str
    
    class ConfigDict:
        from_attributes = True

class TagCreate(BaseModel):
    name: str

@router.get("/tags", response_model=List[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return tag_repo.get_all_tags(db)

@router.post("/meetings/{meeting_id}/tags", response_model=TagResponse)
def add_tag(meeting_id: str, tag: TagCreate, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    return tag_repo.add_tag_to_meeting(db, meeting_id, tag.name)

@router.delete("/meetings/{meeting_id}/tags/{tag_id}")
def remove_tag(meeting_id: str, tag_id: str, db: Session = Depends(get_db)):
    success = tag_repo.remove_tag_from_meeting(db, meeting_id, tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag or Meeting not found")
    return {"status": "removed"}

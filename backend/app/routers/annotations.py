from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.repositories import annotation_repo, meeting_repo
from app.schemas.annotation import AnnotationCreate, AnnotationResponse

router = APIRouter(prefix="/api/v1", tags=["annotations"])
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

@router.get("/meetings/{meeting_id}/annotations", response_model=List[AnnotationResponse])
def get_annotations(meeting_id: str, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return annotation_repo.get_annotations_by_meeting(db, meeting_id)

@router.post("/meetings/{meeting_id}/annotations", response_model=AnnotationResponse)
def create_annotation(meeting_id: str, data: AnnotationCreate, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return annotation_repo.create_annotation(db, meeting_id, DEFAULT_USER_ID, data)

@router.delete("/annotations/{annotation_id}")
def delete_annotation(annotation_id: str, db: Session = Depends(get_db)):
    success = annotation_repo.delete_annotation(db, annotation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return {"status": "deleted"}

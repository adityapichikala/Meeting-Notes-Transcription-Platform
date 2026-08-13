from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.repositories import transcript_repo, meeting_repo
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/search", tags=["search"])

class SearchResult(BaseModel):
    meeting_id: str
    title: str
    meeting_date: str
    match_type: str  # "title", "participant", "transcript"
    snippet: Optional[str] = None
    start_ms: Optional[int] = None

@router.get("", response_model=List[SearchResult])
def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db)
):
    results = []
    # Search meetings (title, participants)
    meetings, _ = meeting_repo.list_meetings(db, "00000000-0000-0000-0000-000000000001", q=q, limit=10)
    for m in meetings:
        results.append(SearchResult(
            meeting_id=m.id,
            title=m.title,
            meeting_date=m.meeting_date.isoformat(),
            match_type="meeting"
        ))
    
    # Search transcripts
    # We need a new repo method for global transcript search
    # Let's add it to transcript_repo
    fts_results = transcript_repo.global_search_transcript_fts(db, q, limit=10)
    for res in fts_results:
        results.append(SearchResult(
            meeting_id=res.meeting_id,
            title=res.meeting_title,
            meeting_date=res.meeting_date.isoformat(),
            match_type="transcript",
            snippet=res.highlighted_text,
            start_ms=res.start_ms
        ))
        
    return results

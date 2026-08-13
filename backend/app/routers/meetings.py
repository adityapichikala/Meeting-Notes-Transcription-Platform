import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.repositories import meeting_repo, transcript_repo
from app.schemas.meeting import MeetingCreateJSON, MeetingListResponse, MeetingResponse, MeetingUpdate
from app.schemas.transcript import TranscriptSearchResponse
from app.services.summary_service import generate_summary_task
from app.services.transcript_parser import parse_transcript
from app.models.action_item import ActionItem

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])

# Hardcoded default user for this assignment
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

@router.get("", response_model=MeetingListResponse)
def list_meetings(
    q: Optional[str] = Query(None, description="Search by title or participant name"),
    participant_id: Optional[str] = Query(None, description="Filter by participant ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    meetings, total = meeting_repo.list_meetings(
        db=db,
        owner_id=DEFAULT_USER_ID,
        q=q,
        participant_id=participant_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    return MeetingListResponse(
        items=meetings,
        total=total,
        offset=offset,
        limit=limit
    )

@router.post("", response_model=MeetingResponse)
async def create_meeting(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        meeting_json = MeetingCreateJSON(**data)
        meeting = meeting_repo.create_meeting(db, DEFAULT_USER_ID, meeting_json, source="manual")
        return meeting
        
    # Form data processing
    form = await request.form()
    title = form.get("title")
    meeting_date_str = form.get("meeting_date")
    
    if not title or not meeting_date_str:
        raise HTTPException(status_code=422, detail="title and meeting_date are required when using form data")
        
    meeting_date = datetime.fromisoformat(meeting_date_str.replace("Z", "+00:00"))
    duration_seconds = int(form.get("duration_seconds", 0))
    description = form.get("description")
    raw_transcript = form.get("raw_transcript")
    file = form.get("file")
        
    meeting_data = MeetingCreateJSON(
        title=title,
        description=description,
        meeting_date=meeting_date,
        duration_seconds=duration_seconds,
        participants=[],
        tags=[]
    )
    
    transcript_content = None
    transcript_format = "txt"
    source = "manual"
    
    if file and hasattr(file, "filename") and file.filename:
        # Mode B: File upload
        content_bytes = await file.read()
        transcript_content = content_bytes.decode('utf-8')
        source = "upload"
        if file.filename.endswith('.json'):
            transcript_format = "json"
        elif file.filename.endswith('.vtt'):
            transcript_format = "vtt"
        elif file.filename.endswith('.txt'):
            transcript_format = "txt"
    elif raw_transcript:
        # Mode C: Pasted raw transcript
        transcript_content = raw_transcript
        source = "paste"
        transcript_format = "txt"
        
    if not transcript_content:
        # Form submission without transcript
        meeting = meeting_repo.create_meeting(db, DEFAULT_USER_ID, meeting_data, source=source)
        return meeting
        
    # With transcript: Parse synchronously
    try:
        segments = parse_transcript(transcript_content, transcript_format)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse transcript: {str(e)}")
        
    # Persist meeting
    meeting = meeting_repo.create_meeting(db, DEFAULT_USER_ID, meeting_data, source=source)
    
    # Persist segments
    transcript_repo.bulk_insert_segments(db, meeting.id, segments)
    
    # Kick off background task
    background_tasks.add_task(generate_summary_task, meeting.id, db)
    
    return meeting

@router.get("/{meeting_id}/transcript")
def search_transcript(
    meeting_id: str,
    q: Optional[str] = Query(None, description="FTS5 search query"),
    db: Session = Depends(get_db)
):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    segments = transcript_repo.get_transcript(db, meeting_id)
    
    if q:
        search_results = transcript_repo.search_transcript_fts(db, meeting_id, q)
        highlight_map = {res.segment_id: res.highlighted_text for res in search_results}
        
        # Merge highlights into segments
        out_segments = []
        for seg in segments:
            seg_dict = {
                "id": seg.id,
                "meeting_id": seg.meeting_id,
                "speaker_id": seg.speaker_id,
                "start_ms": seg.start_ms,
                "end_ms": seg.end_ms,
                "text": highlight_map.get(seg.id, seg.text),
                "speaker": {
                    "id": seg.speaker.id,
                    "label": seg.speaker.label,
                    "color_hex": seg.speaker.color_hex
                } if seg.speaker else None
            }
            out_segments.append(seg_dict)
        return {"segments": out_segments}

    # Return without highlights
    out_segments = []
    for seg in segments:
        out_segments.append({
            "id": seg.id,
            "meeting_id": seg.meeting_id,
            "speaker_id": seg.speaker_id,
            "start_ms": seg.start_ms,
            "end_ms": seg.end_ms,
            "text": seg.text,
            "speaker": {
                "id": seg.speaker.id,
                "label": seg.speaker.label,
                "color_hex": seg.speaker.color_hex
            } if seg.speaker else None
        })
    return {"segments": out_segments}

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(meeting_id: str, update_data: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = meeting_repo.update_meeting(db, meeting_id, update_data)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    success = meeting_repo.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"status": "deleted"}

@router.post("/{meeting_id}/transcript")
async def append_replace_transcript(
    meeting_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    content_type = request.headers.get("content-type", "")
    transcript_format = "txt"
    content = ""
    
    if "application/json" in content_type:
        data = await request.json()
        content = json.dumps(data)
        transcript_format = "json"
    else:
        form = await request.form()
        file = form.get("file")
        raw_transcript = form.get("raw_transcript")
        
        if file and hasattr(file, "filename") and file.filename:
            content = (await file.read()).decode('utf-8')
            if file.filename.endswith('.json'):
                transcript_format = "json"
            elif file.filename.endswith('.vtt'):
                transcript_format = "vtt"
        elif raw_transcript:
            content = raw_transcript
            
    if not content:
        raise HTTPException(status_code=400, detail="Transcript content is required")
        
    try:
        segments = parse_transcript(content, transcript_format)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse transcript: {str(e)}")
        
    transcript_repo.replace_segments(db, meeting_id, segments)
    return {"status": "updated", "segment_count": len(segments)}

from app.repositories import summary_repo
from app.schemas.summary import SummaryResponse, TopicResponse
from starlette.responses import JSONResponse

@router.get("/{meeting_id}/summary", response_model=SummaryResponse)
def get_summary(meeting_id: str, db: Session = Depends(get_db)):
    summary = summary_repo.get_summary(db, meeting_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary

@router.post("/{meeting_id}/summary/regenerate")
def regenerate_summary(meeting_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    background_tasks.add_task(generate_summary_task, meeting_id, db)
    return JSONResponse(status_code=202, content={"status": "processing"})

@router.get("/{meeting_id}/topics", response_model=list[TopicResponse])
def get_topics(meeting_id: str, db: Session = Depends(get_db)):
    topics = summary_repo.get_topics(db, meeting_id)
    return topics

from fastapi.responses import PlainTextResponse

@router.get("/{meeting_id}/export")
def export_meeting(meeting_id: str, format: str = Query("txt", description="Format: txt or md"), db: Session = Depends(get_db)):
    meeting = meeting_repo.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    summary = summary_repo.get_summary(db, meeting_id)
    segments = transcript_repo.get_transcript(db, meeting_id)
    action_items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()
    
    content = ""
    if format == "md":
        content += f"# {meeting.title}\n\n"
        content += f"**Date:** {meeting.meeting_date}\n\n"
        if summary:
            content += f"## Summary\n{summary.overview}\n\n"
        if action_items:
            content += f"## Action Items\n"
            for item in action_items:
                content += f"- [{'x' if item.is_completed else ' '}] {item.text}\n"
            content += "\n"
        content += f"## Transcript\n\n"
        for seg in segments:
            speaker_label = seg.speaker.label if seg.speaker else "Unknown"
            start_min = seg.start_ms // 60000
            start_sec = (seg.start_ms % 60000) // 1000
            content += f"**[{start_min:02d}:{start_sec:02d}] {speaker_label}:** {seg.text}\n\n"
    else:
        # Default TXT
        content += f"TITLE: {meeting.title}\n"
        content += f"DATE: {meeting.meeting_date}\n\n"
        if summary:
            content += f"SUMMARY:\n{summary.overview}\n\n"
        if action_items:
            content += f"ACTION ITEMS:\n"
            for item in action_items:
                content += f"[{'X' if item.is_completed else ' '}] {item.text}\n"
            content += "\n"
        content += f"TRANSCRIPT:\n\n"
        for seg in segments:
            speaker_label = seg.speaker.label if seg.speaker else "Unknown"
            start_min = seg.start_ms // 60000
            start_sec = (seg.start_ms % 60000) // 1000
            content += f"[{start_min:02d}:{start_sec:02d}] {speaker_label}: {seg.text}\n"

    media_type = "text/markdown" if format == "md" else "text/plain"
    filename = f"{meeting.title.replace(' ', '_')}_{meeting.id[:8]}.{format}"
    
    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


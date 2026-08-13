import uuid
from typing import List, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Speaker, TranscriptSegment
from app.schemas.transcript import FTSSearchResult, TranscriptSegmentCreate

def bulk_insert_segments(db: Session, meeting_id: str, segments_data: List[TranscriptSegmentCreate]):
    # Need to handle speakers dynamically
    # For a simple implementation, map speaker_label to speaker_id
    speaker_map = {}
    
    # Retrieve existing speakers or create new ones
    # For a real implementation, we should fetch existing ones first.
    
    speakers_to_add = []
    segments_to_add = []
    
    # Generate unique colors for new speakers
    colors = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"]
    color_idx = 0
    
    for seg_data in segments_data:
        speaker_id = None
        if seg_data.speaker_label:
            label = seg_data.speaker_label
            if label not in speaker_map:
                spk_id = str(uuid.uuid4())
                speaker_map[label] = spk_id
                
                spk = Speaker(
                    id=spk_id,
                    meeting_id=meeting_id,
                    label=label,
                    color_hex=colors[color_idx % len(colors)]
                )
                speakers_to_add.append(spk)
                color_idx += 1
            speaker_id = speaker_map[label]
            
        seg = TranscriptSegment(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            speaker_id=speaker_id,
            sequence_index=seg_data.sequence_index,
            start_ms=seg_data.start_ms,
            end_ms=seg_data.end_ms,
            text=seg_data.text
        )
        segments_to_add.append(seg)
        
    db.bulk_save_objects(speakers_to_add)
    db.bulk_save_objects(segments_to_add)
    db.commit()

def search_transcript_fts(db: Session, meeting_id: str, query: str) -> List[FTSSearchResult]:
    # Use SQLite FTS5 snippet function for highlighting
    # SQLite snippet params: (table, match_col_idx, start_marker, end_marker, ellipsis, num_tokens)
    # We use <b></b> for highlight for simplicity
    
    sql = text("""
        SELECT 
            ts.id,
            snippet(transcript_segments_fts, 0, '<b>', '</b>', '...', 20) as highlighted_text
        FROM transcript_segments_fts fts
        JOIN transcript_segments ts ON ts.rowid = fts.rowid
        WHERE transcript_segments_fts MATCH :query
          AND ts.meeting_id = :meeting_id
        ORDER BY rank
    """)
    
    # In FTS5, query syntax is slightly different, let's wrap in quotes or let user specify
    results = db.execute(sql, {"query": query, "meeting_id": meeting_id}).fetchall()
    
    out = []
    for row in results:
        out.append(FTSSearchResult(
            segment_id=row.id,
            highlighted_text=row.highlighted_text
        ))
    return out

def get_transcript(db: Session, meeting_id: str) -> List[TranscriptSegment]:
    return db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).order_by(TranscriptSegment.sequence_index.asc()).all()

def replace_segments(db: Session, meeting_id: str, segments_data: List[TranscriptSegmentCreate]):
    # Delete existing
    db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).delete()
    # We could delete speakers but they might be tied to other things or it might cascade. Let's leave them or let bulk_insert_segments handle it.
    # We will just reuse bulk_insert_segments
    bulk_insert_segments(db, meeting_id, segments_data)

class GlobalFTSResult:
    def __init__(self, meeting_id: str, meeting_title: str, meeting_date, highlighted_text: str, start_ms: int):
        self.meeting_id = meeting_id
        self.meeting_title = meeting_title
        self.meeting_date = meeting_date
        self.highlighted_text = highlighted_text
        self.start_ms = start_ms

def global_search_transcript_fts(db: Session, query: str, limit: int = 10) -> List[GlobalFTSResult]:
    sql = text("""
        SELECT 
            ts.meeting_id,
            m.title as meeting_title,
            m.meeting_date,
            ts.start_ms,
            snippet(transcript_segments_fts, 0, '<b>', '</b>', '...', 20) as highlighted_text
        FROM transcript_segments_fts fts
        JOIN transcript_segments ts ON ts.rowid = fts.rowid
        JOIN meetings m ON ts.meeting_id = m.id
        WHERE transcript_segments_fts MATCH :query
        ORDER BY rank
        LIMIT :limit
    """)
    
    results = db.execute(sql, {"query": query, "limit": limit}).fetchall()
    
    out = []
    for row in results:
        out.append(GlobalFTSResult(
            meeting_id=row.meeting_id,
            meeting_title=row.meeting_title,
            meeting_date=row.meeting_date,
            highlighted_text=row.highlighted_text,
            start_ms=row.start_ms
        ))
    return out

import logging
import time
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Meeting, Summary, Topic, ActionItem, TranscriptSegment

logger = logging.getLogger(__name__)

class SummaryGenerator(ABC):
    @abstractmethod
    def generate(self, segments: List[TranscriptSegment]) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Takes a list of transcript segments and returns:
        1. overview (str)
        2. topics (List of dicts with title, start_ms)
        3. action_items (List of dicts with text, source_segment_id)
        """
        pass

class MockSummaryGenerator(SummaryGenerator):
    def generate(self, segments: List[TranscriptSegment]) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        if not segments:
            return "No transcript available.", [], []
            
        word_count = sum(len(seg.text.split()) for seg in segments)
        num_segments = len(segments)
        
        overview = f"This is a deterministically generated mock summary. The meeting contained {num_segments} segments and approximately {word_count} words."
        
        # Generate topics based on segments length
        topics = []
        if num_segments > 0:
            topics.append({"title": "Introduction & Kickoff", "start_ms": segments[0].start_ms})
        if num_segments > 5:
            topics.append({"title": "Main Discussion", "start_ms": segments[num_segments // 2].start_ms})
            
        # Extract first-pass action items grounded in segments
        # Look for keywords like "will do", "need to", "action"
        action_items = []
        for seg in segments:
            text_lower = seg.text.lower()
            if "will" in text_lower or "need to" in text_lower or "action" in text_lower:
                action_items.append({
                    "text": f"Follow up on: {seg.text[:50]}...",
                    "source_segment_id": seg.id
                })
                
        # Limit to max 3 mock action items for determinism
        action_items = action_items[:3]
        
        return overview, topics, action_items

class LLMSummaryGenerator(SummaryGenerator):
    def generate(self, segments: List[TranscriptSegment]) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        # Graceful fallback if no API key
        if not settings.LLM_API_KEY:
            logger.warning("LLM_API_KEY is not configured. Falling back to stubbed LLM generation.")
            return "This is a stubbed LLM summary because LLM_API_KEY is missing.", [], []
            
        # In a real implementation, we would make an HTTPX request to OpenAI/Anthropic etc.
        # For this assignment, we will simulate the LLM call.
        logger.info(f"Calling LLM provider with {len(segments)} segments...")
        time.sleep(2) # Simulate network call
        
        return (
            "LLM-generated overview paragraph.",
            [{"title": "LLM Topic 1", "start_ms": 0}],
            [{"text": "LLM generated action item", "source_segment_id": segments[0].id if segments else None}]
        )

def get_summary_generator() -> SummaryGenerator:
    if settings.LLM_PROVIDER.lower() == "llm":
        return LLMSummaryGenerator()
    return MockSummaryGenerator()

def generate_summary_task(meeting_id: str, db: Session):
    logger.info(f"Starting summary generation for meeting {meeting_id}")
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        logger.error(f"Meeting {meeting_id} not found for summarization.")
        return
        
    meeting.status = "processing"
    db.commit()
    
    # Get segments
    segments = db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).order_by(TranscriptSegment.sequence_index.asc()).all()
    
    # Generate
    generator = get_summary_generator()
    overview, topics_data, action_items_data = generator.generate(segments)
    
    # Save Summary
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if not summary:
        summary = Summary(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            overview=overview,
            generated_by="system",
            model_name=settings.LLM_PROVIDER,
            generated_at=datetime.now(timezone.utc),
            status="ready"
        )
        db.add(summary)
    else:
        summary.overview = overview
        summary.status = "ready"
        summary.generated_at = datetime.now(timezone.utc)
        summary.model_name = settings.LLM_PROVIDER
        
    # Overwrite topics
    db.query(Topic).filter(Topic.meeting_id == meeting_id).delete()
    for idx, t_data in enumerate(topics_data):
        topic = Topic(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            title=t_data["title"],
            start_ms=t_data["start_ms"],
            sequence_index=idx
        )
        db.add(topic)
        
    # Insert new action items
    for a_data in action_items_data:
        ai = ActionItem(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            text=a_data["text"],
            source_segment_id=a_data.get("source_segment_id"),
            is_completed=False,
            version=1
        )
        db.add(ai)
        
    # Update meeting status to ready
    meeting.status = "ready"
    db.commit()
    
    logger.info(f"Completed summary generation for meeting {meeting_id}")

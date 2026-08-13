import pytest
from app.services.summary_service import MockSummaryGenerator
from app.models import TranscriptSegment
import uuid

def test_mock_summary_generator_determinism():
    generator = MockSummaryGenerator()
    
    # Create some dummy segments
    seg1 = TranscriptSegment(id=str(uuid.uuid4()), text="Hello team, we need to finalize the design.", start_ms=0)
    seg2 = TranscriptSegment(id=str(uuid.uuid4()), text="I will do the mockups.", start_ms=1000)
    seg3 = TranscriptSegment(id=str(uuid.uuid4()), text="Great, let's schedule a follow-up action for next week.", start_ms=2000)
    
    segments = [seg1, seg2, seg3]
    
    # Generate multiple times and ensure outputs are exactly the same
    overview1, topics1, ai1 = generator.generate(segments)
    overview2, topics2, ai2 = generator.generate(segments)
    
    assert overview1 == overview2
    assert topics1 == topics2
    assert ai1 == ai2
    
    # Verify AI extraction logic (keywords: "need to", "will", "action")
    assert len(ai1) == 3
    assert "Hello team, we need to" in ai1[0]["text"]
    assert ai1[0]["source_segment_id"] == seg1.id
    
    assert "I will do" in ai1[1]["text"]
    assert ai1[1]["source_segment_id"] == seg2.id
    
    assert "action" in ai1[2]["text"]
    assert ai1[2]["source_segment_id"] == seg3.id

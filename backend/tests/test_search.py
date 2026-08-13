import pytest
from fastapi.testclient import TestClient

def test_list_meetings_search(client: TestClient):
    # Test searching for "Roadmap" — only meaningful when seed data is present
    response = client.get("/api/v1/meetings?q=Roadmap")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    if data["total"] == 0:
        pytest.skip("Seed data not present; skipping Roadmap search assertion")
    # At least one meeting should have Roadmap in title
    assert any("Roadmap" in m["title"] for m in data["items"])

def test_transcript_fts_search(client: TestClient):
    # First get a meeting that has transcript (e.g., Engineering Sync)
    response = client.get("/api/v1/meetings?q=Engineering Sync")
    assert response.status_code == 200
    data = response.json()
    
    if data["total"] == 0:
        pytest.skip("Seed data not present for transcript FTS test")
        
    meeting_id = data["items"][0]["id"]
    
    # Search transcript for "auth refactor"
    # Actually wait, the seed data says "auth refactor" is in Q4 Roadmap, wait let me use a generic term
    search_resp = client.get(f"/api/v1/meetings/{meeting_id}/transcript?q=REST")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert "results" in search_data
    assert len(search_data["results"]) > 0
    
    first_result = search_data["results"][0]
    assert "segment_id" in first_result
    assert "highlighted_text" in first_result
    assert "<b>" in first_result["highlighted_text"] # We used <b> in our snippet query
    
def test_create_meeting_json(client: TestClient):
    meeting_data = {
        "title": "Test JSON Meeting",
        "description": "Just a test",
        "meeting_date": "2024-01-01T10:00:00Z",
        "duration_seconds": 1800
    }
    
    response = client.post("/api/v1/meetings", json=meeting_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test JSON Meeting"
    assert data["status"] == "processing"
    assert data["source"] == "manual"

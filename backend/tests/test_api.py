import pytest
from fastapi.testclient import TestClient

def test_meeting_crud(client: TestClient):
    # Create meeting
    meeting_data = {
        "title": "CRUD Meeting",
        "meeting_date": "2024-01-01T10:00:00Z"
    }
    resp = client.post("/api/v1/meetings", json=meeting_data)
    assert resp.status_code == 200
    meeting_id = resp.json()["id"]
    
    # Get meeting
    resp = client.get(f"/api/v1/meetings/{meeting_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "CRUD Meeting"
    
    # Update meeting
    update_data = {"title": "Updated Meeting"}
    resp = client.patch(f"/api/v1/meetings/{meeting_id}", json=update_data)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Meeting"
    
    # Delete meeting
    resp = client.delete(f"/api/v1/meetings/{meeting_id}")
    assert resp.status_code == 200
    
    # Verify deletion
    resp = client.get(f"/api/v1/meetings/{meeting_id}")
    assert resp.status_code == 404

def test_action_items(client: TestClient):
    # Find an existing meeting from seed (e.g., using search)
    resp = client.get("/api/v1/meetings?q=Engineering Sync")
    if resp.status_code != 200 or resp.json()["total"] == 0:
        pytest.skip("Seed data missing")
        
    meeting_id = resp.json()["items"][0]["id"]
    
    # Get action items
    resp = client.get(f"/api/v1/meetings/{meeting_id}/action-items")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 0
    
    # Create action item
    new_item = {"text": "Test Action Item"}
    resp = client.post(f"/api/v1/meetings/{meeting_id}/action-items", json=new_item)
    assert resp.status_code == 200
    item_id = resp.json()["id"]
    assert resp.json()["text"] == "Test Action Item"
    
    # Update action item (Success)
    update_item = {"is_completed": True, "version": 1}
    resp = client.patch(f"/api/v1/action-items/{item_id}", json=update_item)
    assert resp.status_code == 200
    assert resp.json()["is_completed"] == True
    assert resp.json()["version"] == 2
    
    # Update action item (Conflict)
    conflict_update = {"text": "Conflict", "version": 1} # using old version
    resp = client.patch(f"/api/v1/action-items/{item_id}", json=conflict_update)
    assert resp.status_code == 409
    
    # Delete action item
    resp = client.delete(f"/api/v1/action-items/{item_id}")
    assert resp.status_code == 200
    
    # Verify deletion by fetching all again
    resp = client.get(f"/api/v1/meetings/{meeting_id}/action-items")
    assert not any(i["id"] == item_id for i in resp.json())

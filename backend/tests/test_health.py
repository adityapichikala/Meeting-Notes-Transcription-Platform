"""
Smoke test: verify the health endpoint returns 200 with status=ok.

Run with: pytest tests/test_health.py -v
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_returns_200(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_returns_ok_status(client: TestClient):
    response = client.get("/api/v1/health")
    body = response.json()
    assert body["status"] == "ok"
    assert "timestamp" in body

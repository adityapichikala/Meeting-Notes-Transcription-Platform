"""
Health check router.

GET /api/v1/health — used by load balancers, deployment pipelines,
and the frontend to verify the API is reachable.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health", summary="Health check")
def health_check() -> dict:
    """Return API liveness status and current UTC timestamp."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

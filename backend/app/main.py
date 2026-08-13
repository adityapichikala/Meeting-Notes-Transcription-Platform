"""
FastAPI application entry point.

Responsibilities:
- Create the FastAPI app instance
- Register CORS middleware (allow http://localhost:3000)
- Mount all routers
- Lifespan: nothing to do yet (DB tables are managed by Alembic)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN001
    """
    Application lifespan context manager.

    Startup: tables are managed by Alembic — no create_all() here.
    Shutdown: nothing to clean up at this stage.
    """
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router)
    from app.routers import meetings, action_items, search, tags, annotations
    app.include_router(meetings.router)
    app.include_router(action_items.router)
    app.include_router(search.router)
    app.include_router(tags.router)
    app.include_router(annotations.router)

    return app


app = create_app()

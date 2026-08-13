"""
Database engine, session factory, and dependency injection for SQLAlchemy.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────

# SQLite requires check_same_thread=False when used with FastAPI's threadpool.
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,  # Log SQL statements in debug mode
)

# Enable WAL mode and foreign key enforcement for SQLite connections.
if settings.DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# ── Session factory ───────────────────────────────────────────────────────────

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Declarative base ──────────────────────────────────────────────────────────

Base = declarative_base()

# ── FastAPI dependency ────────────────────────────────────────────────────────


def get_db() -> Generator[Session, None, None]:
    """Yield a database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

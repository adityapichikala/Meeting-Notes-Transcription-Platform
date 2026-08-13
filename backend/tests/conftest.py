"""
conftest.py — creates a single in-memory SQLite DB shared across all test
sessions using StaticPool, so tables created by setup_test_db are visible
to every TestClient request.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


# StaticPool forces every SQLAlchemy "connection" to reuse the same underlying
# sqlite3 connection, which means in-memory tables survive across sessions.
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all ORM tables once per test run, then tear down."""
    from app.core.db import Base
    import app.models  # noqa: F401 – registers every ORM model

    Base.metadata.create_all(bind=test_engine)

    # Seed the one user row that all meeting endpoints require.
    from app.models.user import User
    db = TestSessionLocal()
    try:
        if not db.query(User).filter_by(id="00000000-0000-0000-0000-000000000001").first():
            db.add(User(
                id="00000000-0000-0000-0000-000000000001",
                name="Default User",
                email="default@meetingmind.dev",
            ))
            db.commit()
    finally:
        db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="module")
def client():
    """
    TestClient with get_db overridden to use the shared in-memory engine.
    Imported lazily so conftest fixtures run before app modules cache the engine.
    """
    from app.core.db import get_db
    from app.main import app

    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

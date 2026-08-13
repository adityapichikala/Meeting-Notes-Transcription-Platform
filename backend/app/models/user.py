"""
User model.

Single default user for this assignment, but modeled as a proper entity
so multi-user support can be added without schema changes.
"""

from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.orm import relationship

from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    # uuid stored as text (SQLite has no native UUID type)
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    meetings = relationship("Meeting", back_populates="owner", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="author")

    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r}>"

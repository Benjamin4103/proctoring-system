import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("exam_sessions.id"))
    type = Column(String(50), nullable=False)
    severity = Column(String(10), nullable=False)
    confidence = Column(Float)
    description = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())

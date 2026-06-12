import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(
        Enum("active", "completed", "terminated", name="session_status"),
        default="active"
    )
    suspicion_score = Column(Float, default=0.0)
    risk_level = Column(
        Enum("low", "medium", "high", "severe", name="risk_level"),
        default="low"
    )
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

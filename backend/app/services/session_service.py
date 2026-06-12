from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.session import ExamSession
from app.models.exam import Exam
import uuid

async def create_session(db: AsyncSession, exam_id: str, student_id: str) -> ExamSession:
    session = ExamSession(
        exam_id=uuid.UUID(exam_id),
        student_id=uuid.UUID(student_id),
        status="active",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def update_score(db: AsyncSession, session_id: str, score: float, risk: str):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == uuid.UUID(session_id))
    )
    session = result.scalar_one_or_none()
    if session:
        session.suspicion_score = score
        session.risk_level = risk
        await db.commit()

async def get_all_active(db: AsyncSession):
    result = await db.execute(
        select(ExamSession).where(ExamSession.status == "active")
    )
    return result.scalars().all()

async def get_session(db: AsyncSession, session_id: str):
    result = await db.execute(
        select(ExamSession).where(ExamSession.id == uuid.UUID(session_id))
    )
    return result.scalar_one_or_none()

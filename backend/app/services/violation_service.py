from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.violation import Violation
from app.models.session import ExamSession
import uuid

async def log_violation(db: AsyncSession, session_id: str, violation):
    v = Violation(
        session_id=uuid.UUID(session_id),
        type=violation.type,
        severity=violation.severity,
        confidence=violation.confidence,
        description=violation.description,
        metadata_=violation.metadata,
    )
    db.add(v)
    await db.commit()

async def get_violations(db: AsyncSession, session_id: str):
    result = await db.execute(
        select(Violation)
        .where(Violation.session_id == uuid.UUID(session_id))
        .order_by(Violation.occurred_at.desc())
        .limit(100)
    )
    return result.scalars().all()

async def get_violation_counts(db: AsyncSession, session_id: str):
    result = await db.execute(
        select(Violation.type, func.count(Violation.id))
        .where(Violation.session_id == uuid.UUID(session_id))
        .group_by(Violation.type)
    )
    return dict(result.all())

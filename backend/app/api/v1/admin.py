from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import require_admin
from app.models.session import ExamSession
from app.models.violation import Violation
from app.models.user import User
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/sessions")
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    result = await db.execute(select(ExamSession))
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        user_result = await db.execute(select(User).where(User.id == s.student_id))
        user = user_result.scalar_one_or_none()
        out.append({
            "id": str(s.id),
            "student_name": user.full_name if user else "Unknown",
            "student_email": user.email if user else "",
            "status": s.status,
            "suspicion_score": s.suspicion_score,
            "risk_level": s.risk_level,
            "started_at": s.started_at.isoformat() if s.started_at else None,
        })
    return out

@router.get("/sessions/{session_id}/violations")
async def get_violations(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    result = await db.execute(
        select(Violation)
        .where(Violation.session_id == uuid.UUID(session_id))
        .order_by(Violation.occurred_at.desc())
    )
    violations = result.scalars().all()
    return [
        {
            "id": str(v.id),
            "type": v.type,
            "severity": v.severity,
            "confidence": v.confidence,
            "description": v.description,
            "occurred_at": v.occurred_at.isoformat() if v.occurred_at else None,
        }
        for v in violations
    ]

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin)
):
    sessions_result = await db.execute(select(ExamSession))
    sessions = sessions_result.scalars().all()
    violations_result = await db.execute(select(Violation))
    violations = violations_result.scalars().all()
    return {
        "total_sessions": len(sessions),
        "active_sessions": len([s for s in sessions if s.status == "active"]),
        "total_violations": len(violations),
        "high_risk_students": len([s for s in sessions if s.risk_level in ("high", "severe")]),
    }

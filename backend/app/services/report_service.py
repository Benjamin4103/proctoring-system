import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.violation import Violation
from app.models.session import ExamSession
from app.models.user import User
import uuid

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"

async def generate_report(session_id: str, db: AsyncSession) -> str:
    session_uuid = uuid.UUID(session_id)

    # Get session
    session_result = await db.execute(
        select(ExamSession).where(ExamSession.id == session_uuid)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        return "Session not found."

    # Get student
    student_result = await db.execute(
        select(User).where(User.id == session.student_id)
    )
    student = student_result.scalar_one_or_none()

    # Get violation counts
    counts_result = await db.execute(
        select(Violation.type, func.count(Violation.id))
        .where(Violation.session_id == session_uuid)
        .group_by(Violation.type)
    )
    counts = dict(counts_result.all())

    if not counts:
        return "No violations were recorded during this exam session."

    violation_summary = "\n".join(
        f"- {vtype.replace('_', ' ')}: {count} time(s)"
        for vtype, count in counts.items()
    )

    prompt = f"""You are an exam integrity analyst. Write a professional 3-4 sentence exam integrity report.

Student: {student.full_name if student else 'Unknown'}
Suspicion score: {session.suspicion_score}/100
Risk level: {session.risk_level}

Violations detected:
{violation_summary}

Write a concise factual report. End with one of: PASS, FLAG FOR REVIEW, or ESCALATE."""

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        })
        return resp.json().get("response", "Report generation failed.")

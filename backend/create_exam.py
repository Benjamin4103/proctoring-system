import asyncio
from app.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.session import ExamSession
from app.models.user import User
from sqlalchemy import select
import uuid

async def main():
    async with AsyncSessionLocal() as db:
        # Get student
        result = await db.execute(select(User).where(User.email == "student@test.com"))
        student = result.scalar_one_or_none()

        # Get admin
        result2 = await db.execute(select(User).where(User.email == "admin@test.com"))
        admin = result2.scalar_one_or_none()

        # Create exam
        exam = Exam(
            title="Sample Exam 1",
            created_by=admin.id,
            duration_minutes=60,
        )
        db.add(exam)
        await db.commit()
        await db.refresh(exam)

        # Create session
        session = ExamSession(
            exam_id=exam.id,
            student_id=student.id,
            status="active",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        print(f"Exam created: {exam.id}")
        print(f"Session created: {session.id}")
        print(f"Use this session ID in the exam page: {session.id}")

asyncio.run(main())

import asyncio
from sqlalchemy import delete, select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

async def main():
    async with AsyncSessionLocal() as db:
        # Delete existing users with these emails
        await db.execute(delete(User).where(User.email.in_(["admin@test.com", "student@test.com"])))
        await db.commit()

        # Recreate them
        admin = User(
            email="admin@test.com",
            full_name="Test Admin",
            role="admin",
            password_hash=hash_password("password123"),
        )
        student = User(
            email="student@test.com",
            full_name="Test Student",
            role="student",
            password_hash=hash_password("password123"),
        )
        db.add(admin)
        db.add(student)
        await db.commit()

        # Verify
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"Created: {u.email} | role: {u.role}")

asyncio.run(main())

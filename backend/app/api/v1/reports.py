from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_admin
from app.services.report_service import generate_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/{session_id}")
async def get_report(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    report = await generate_report(session_id, db)
    return {"session_id": session_id, "report": report}

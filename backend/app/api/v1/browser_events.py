from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.violation import Violation
import uuid

router = APIRouter(prefix="/browser-events", tags=["browser"])

class BrowserEvent(BaseModel):
    session_id: str
    type: str
    timestamp: int

SEVERITY_MAP = {
    "tab_switch": ("high", 30),
    "window_blur": ("medium", 15),
    "fullscreen_exit": ("medium", 15),
}

@router.post("")
async def log_browser_event(
    event: BrowserEvent,
    db: AsyncSession = Depends(get_db),
):
    severity, _ = SEVERITY_MAP.get(event.type, ("low", 5))
    violation = Violation(
        session_id=uuid.UUID(event.session_id),
        type=event.type,
        severity=severity,
        confidence=0.99,
        description=f"Browser event: {event.type.replace('_', ' ')}",
        metadata_={"timestamp": event.timestamp},
    )
    db.add(violation)
    await db.commit()
    return {"status": "logged"}

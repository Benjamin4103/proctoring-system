import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.connection_manager import manager
from app.database import AsyncSessionLocal
from app.services.violation_service import log_violation
from app.services.session_service import update_score
from ai_engine.pipeline import ProctorPipeline

router = APIRouter()
_pipelines: dict = {}

@router.websocket("/ws/proctor/{session_id}")
async def proctor_stream(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    if session_id not in _pipelines:
        _pipelines[session_id] = ProctorPipeline(session_id=session_id)
    pipeline = _pipelines[session_id]

    try:
        while True:
            frame_bytes = await asyncio.wait_for(websocket.receive_bytes(), timeout=10.0)
            result = await asyncio.get_event_loop().run_in_executor(
                None, pipeline.analyse_frame, frame_bytes
            )

            async with AsyncSessionLocal() as db:
                for v in result.violations:
                    await log_violation(db, session_id, v)
                await update_score(db, session_id, result.suspicion_score, result.risk_level)

            await websocket.send_json({
                "type": "analysis",
                "face_present": result.face_present,
                "person_count": result.person_count,
                "gaze_direction": result.gaze_direction,
                "phone_detected": result.phone_detected,
                "suspicion_score": result.suspicion_score,
                "risk_level": result.risk_level,
                "violations": [
                    {"type": v.type, "severity": v.severity, "description": v.description}
                    for v in result.violations
                ],
            })
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        _pipelines.pop(session_id, None)
    except asyncio.TimeoutError:
        manager.disconnect(session_id)
        _pipelines.pop(session_id, None)
        await websocket.close()
    except Exception as e:
        manager.disconnect(session_id)
        _pipelines.pop(session_id, None)

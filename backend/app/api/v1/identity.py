from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from ai_engine.face_verifier import encode_face_from_image, verify_face
import base64

router = APIRouter(prefix="/identity", tags=["identity"])

@router.post("/register-face")
async def register_face(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_bytes = await file.read()
    embedding = encode_face_from_image(image_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")
    current_user.face_embedding = embedding
    await db.commit()
    return {"status": "Face registered successfully"}

class VerifyRequest(BaseModel):
    image_b64: str

@router.post("/verify-face")
async def verify_face_endpoint(
    data: VerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.face_embedding:
        raise HTTPException(status_code=400, detail="No face registered for this user")
    image_bytes = base64.b64decode(data.image_b64)
    result = verify_face(image_bytes, current_user.face_embedding)
    return result

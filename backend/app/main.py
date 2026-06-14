from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, admin, browser_events, reports
import os

app = FastAPI(title="AI Proctoring System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(browser_events.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")

if os.getenv("ENVIRONMENT") != "production":
    from app.api.v1 import identity
    from app.websocket import proctoring_ws
    app.include_router(identity.router, prefix="/api/v1")
    app.include_router(proctoring_ws.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

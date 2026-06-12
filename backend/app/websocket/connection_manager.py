from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active.pop(session_id, None)

    async def send_json(self, session_id: str, data: dict):
        ws = self.active.get(session_id)
        if ws:
            await ws.send_json(data)

manager = ConnectionManager()

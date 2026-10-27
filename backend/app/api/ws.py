import asyncio
import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.attendance_service import attendance_service
from app.vision.pipeline import vision_pipeline

logger = logging.getLogger("attendance.api.ws")
router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        message = json.dumps(data)
        stale = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                stale.append(connection)
        for dead in stale:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Stream live system stats and face telemetry every 300ms
            stats = attendance_service.get_live_stats()
            stats["camera_connected"] = vision_pipeline.camera.is_running
            stats["fps"] = vision_pipeline.camera.get_fps()
            stats["faces"] = attendance_service.current_frame_faces

            payload = {
                "type": "SYSTEM_UPDATE",
                "data": stats
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.3)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)

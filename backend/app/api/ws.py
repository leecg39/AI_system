from typing import Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt

from app.core.config import settings

router = APIRouter()


class TaskStreamManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, task_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if task_id not in self.connections:
            self.connections[task_id] = []
        self.connections[task_id].append(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket) -> None:
        task_connections = self.connections.get(task_id, [])
        if websocket in task_connections:
            task_connections.remove(websocket)
        if not task_connections and task_id in self.connections:
            del self.connections[task_id]

    async def broadcast(self, task_id: str, payload: dict[str, Any]) -> None:
        task_connections = self.connections.get(task_id, [])
        stale: list[WebSocket] = []
        for connection in task_connections:
            try:
                await connection.send_json(payload)
            except RuntimeError:
                stale.append(connection)

        for connection in stale:
            self.disconnect(task_id, connection)


stream_manager = TaskStreamManager()


def decode_token_subject(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

    subject = payload.get("sub")
    if subject is None:
        return None
    return str(subject)


@router.websocket("/ws/tasks/{task_id}")
async def task_stream_endpoint(
    websocket: WebSocket,
    task_id: str,
):
    token = websocket.query_params.get("token")
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = decode_token_subject(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await stream_manager.connect(task_id, websocket)
    await websocket.send_json(
        {
            "type": "connected",
            "task_id": task_id,
            "user_id": user_id,
        }
    )

    try:
        while True:
            message = await websocket.receive_json()
            action = message.get("action")
            if action == "ping":
                await websocket.send_json({"type": "pong", "task_id": task_id})
                continue

            if action == "broadcast":
                payload = message.get("payload")
                if isinstance(payload, dict):
                    event_payload = {
                        "type": "event",
                        "task_id": task_id,
                        **payload,
                    }
                else:
                    event_payload = {
                        "type": "event",
                        "task_id": task_id,
                        "message": str(payload),
                    }
                await stream_manager.broadcast(task_id, event_payload)
                continue

            await websocket.send_json({"type": "ack", "task_id": task_id})
    except WebSocketDisconnect:
        stream_manager.disconnect(task_id, websocket)

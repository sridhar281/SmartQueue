"""The single WebSocket endpoint.

    ws://localhost:8000/ws?rooms=admin
    ws://localhost:8000/ws?rooms=service:3,user:42

Rooms are passed as a query string because browsers cannot set headers on a
WebSocket handshake. The socket is read-only: the server pushes, the client
never sends commands through it. Anything that changes data goes through the
authenticated REST API, so an unauthenticated socket cannot do damage.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, rooms: str = "admin"):
    room_list = [r.strip() for r in rooms.split(",") if r.strip()] or ["admin"]
    await manager.connect(websocket, room_list)
    await websocket.send_json({"event": "connected", "data": {"rooms": room_list}})

    try:
        while True:
            # We only read to detect disconnects and to answer heartbeats.
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)

"""A small WebSocket connection manager.

Clients subscribe to a "room":
    - "admin"          -> every queue change
    - "service:3"      -> changes affecting service 3
    - "user:42"        -> messages for one customer (their token was called)

The manager only knows how to connect, disconnect and broadcast. There is no
event bus, no pub/sub broker, no message schema registry. If the process
restarts, browsers reconnect and refetch state over REST - the WebSocket is an
optimisation on top of the REST API, never the only source of truth.

Scaling note: connections live in this process's memory, so with two backend
instances a customer connected to instance A would miss a broadcast made on
instance B. The usual fix is Redis pub/sub, which we deliberately skip here.
"""

import asyncio
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, rooms: list[str]) -> None:
        await websocket.accept()
        async with self._lock:
            for room in rooms:
                self.rooms[room].add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            for connections in self.rooms.values():
                connections.discard(websocket)

    async def broadcast(self, room: str, message: dict) -> None:
        """Send a JSON message to everyone in a room, dropping dead sockets."""
        connections = list(self.rooms.get(room, ()))
        dead = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)

        if dead:
            async with self._lock:
                for connection in dead:
                    for room_connections in self.rooms.values():
                        room_connections.discard(connection)

    async def broadcast_many(self, rooms: list[str], message: dict) -> None:
        for room in dict.fromkeys(rooms):  # de-duplicate, keep order
            await self.broadcast(room, message)


manager = ConnectionManager()


async def broadcast_queue_update(event: str, payload: dict) -> None:
    """One helper used by every queue endpoint.

    Admins always hear about it; the affected service room and the affected
    customer hear about it when we know who they are.
    """
    rooms = ["admin"]
    if payload.get("service_id"):
        rooms.append(f"service:{payload['service_id']}")
    if payload.get("user_id"):
        rooms.append(f"user:{payload['user_id']}")

    await manager.broadcast_many(rooms, {"event": event, "data": payload})

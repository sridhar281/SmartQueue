"use client";

/**
 * Subscribe to live queue events.
 *
 * Reconnection matters more than the socket itself: laptops sleep, phones
 * switch networks. On close we retry with backoff, and on every successful
 * reconnect the caller refetches over REST so no missed event can leave the
 * screen stale. The WebSocket is a speed-up on top of the REST API, not the
 * source of truth.
 */
import { useEffect, useRef, useState } from "react";
import type { QueueEvent } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useQueueSocket(rooms: string[], onEvent: (event: QueueEvent) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const key = rooms.join(",");

  useEffect(() => {
    if (!key) return;

    let socket: WebSocket | null = null;
    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let closedByUs = false;

    const connect = () => {
      socket = new WebSocket(`${WS_URL}/ws?rooms=${encodeURIComponent(key)}`);

      socket.onopen = () => {
        retry = 0;
        setConnected(true);
        // Keeps proxies from dropping an idle connection.
        heartbeat = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), 25000);
      };

      socket.onmessage = (message) => {
        try { handlerRef.current(JSON.parse(message.data) as QueueEvent); } catch { /* ignore */ }
      };

      socket.onclose = () => {
        setConnected(false);
        clearInterval(heartbeat);
        if (closedByUs) return;
        retry += 1;
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** retry, 15000));
      };
    };

    connect();
    return () => {
      closedByUs = true;
      clearInterval(heartbeat);
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [key]);

  return { connected };
}

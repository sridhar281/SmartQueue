"use client";

/** In-app notifications. Queue events become human sentences here. */
import { useCallback, useState } from "react";
import type { QueueEvent } from "@/types";

export interface Notification {
  id: string;
  message: string;
  tone: "info" | "success" | "warning";
  at: Date;
  read: boolean;
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);

  const push = useCallback((message: string, tone: Notification["tone"] = "info") => {
    setItems((current) => [
      { id: crypto.randomUUID(), message, tone, at: new Date(), read: false },
      ...current,
    ].slice(0, 30));
  }, []);

  /** Translate a raw event into a sentence the customer understands. */
  const fromEvent = useCallback((event: QueueEvent, myTokenNumber?: string) => {
    const data = event.data as { token_number?: string; counter_name?: string; people_ahead?: number };
    const isMine = data.token_number && data.token_number === myTokenNumber;

    if (event.event === "token_called" && isMine) {
      push(`Your token ${data.token_number} has been called. Go to ${data.counter_name ?? "the counter"}.`, "success");
    } else if (event.event === "token_completed" && !isMine) {
      push("Someone ahead of you has finished. Your position moved up.", "info");
    } else if (event.event === "token_skipped" && isMine) {
      push("You were marked as not present. Speak to the front desk.", "warning");
    } else if (event.event === "counter_updated") {
      push("A counter changed status. Your estimated wait has been updated.", "info");
    }
  }, [push]);

  const markAllRead = useCallback(() => setItems((c) => c.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setItems([]), []);

  return { items, unread: items.filter((n) => !n.read).length, push, fromEvent, markAllRead, clear };
}

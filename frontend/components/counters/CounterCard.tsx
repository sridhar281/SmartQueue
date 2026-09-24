"use client";
import { CheckCheck, Power, SkipForward, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Counter } from "@/types";

/**
 * One counter, with the four actions a staff member needs. The button set
 * changes with the counter's state so there is never a wrong button to press.
 */
export function CounterCard({
  counter, busy, onOpen, onClose, onCallNext, onComplete, onSkip,
}: {
  counter: Counter;
  busy?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCallNext: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const offline = counter.status === "OFFLINE";
  const serving = Boolean(counter.current_token);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">{counter.name}</h3>
        <Badge status={counter.status} />
      </div>

      <div className="mt-4 min-h-[68px] rounded-lg bg-slate-50 px-4 py-3">
        {serving ? (
          <>
            <p className="text-xs text-slate-500">Serving now</p>
            <p className="font-mono text-2xl font-semibold text-slate-900">{counter.current_token}</p>
            <p className="text-xs text-slate-500">{counter.current_customer} · {counter.current_service}</p>
          </>
        ) : (
          <p className="pt-3 text-sm text-slate-500">
            {offline ? "Closed. Open it to start serving." : "Free. Call the next customer."}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {offline ? (
          <Button size="sm" loading={busy} onClick={onOpen}>
            <Power className="h-4 w-4" /> Open counter
          </Button>
        ) : serving ? (
          <>
            <Button size="sm" variant="success" loading={busy} onClick={onComplete}>
              <CheckCheck className="h-4 w-4" /> Complete
            </Button>
            <Button size="sm" variant="secondary" loading={busy} onClick={onSkip}>
              <SkipForward className="h-4 w-4" /> Skip
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" loading={busy} onClick={onCallNext}>
              <UserPlus className="h-4 w-4" /> Call next
            </Button>
            <Button size="sm" variant="ghost" loading={busy} onClick={onClose}>Close counter</Button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/utils";
import type { QueueToken } from "@/types";
import { QueueProgress } from "./QueueProgress";

/**
 * The customer's live token. This is the screen people will stare at on a
 * phone while they wait, so the token number is the largest thing on it and
 * everything else is secondary.
 */
export function TokenCard({ token }: { token: QueueToken }) {
  const called = token.status === "CALLED" || token.status === "SERVING";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className={`px-6 py-8 text-center ${called ? "bg-emerald-50" : "bg-slate-50"}`}>
        <p className="text-xs font-medium text-slate-500">{token.service_name}</p>

        <div className="relative mt-3 inline-block">
          {called && (
            <span className="absolute inset-0 rounded-full bg-emerald-300/40 animate-pulse-ring" aria-hidden />
          )}
          <p className="relative font-mono text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            {token.token_number}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <Badge status={token.status} />
        </div>

        {called && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            It's your turn. Please go to {token.counter_name ?? "the counter"}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        <Stat label="People ahead" value={called ? "0" : String(token.people_ahead)} />
        <Stat label="Estimated wait" value={called ? "Now" : formatMinutes(token.estimated_wait_minutes)} />
        <Stat label="Now serving" value={token.now_serving ?? "—"} mono />
      </div>

      {!called && (
        <div className="border-t border-slate-100 px-6 py-5">
          <QueueProgress peopleAhead={token.people_ahead} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold text-slate-900 ${mono ? "font-mono text-base" : ""}`}>{value}</p>
    </div>
  );
}

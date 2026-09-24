import { Clock } from "lucide-react";
import { formatMinutes } from "@/lib/utils";

/** Explains where the estimate came from, so the number feels trustworthy. */
export function WaitTimeCard({
  peopleAhead, averageMinutes, openCounters, estimateMinutes,
}: { peopleAhead: number; averageMinutes: number; openCounters: number; estimateMinutes: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Clock className="h-4 w-4 text-slate-400" /> How we worked this out
      </div>

      <p className="mt-3 font-mono text-sm text-slate-600">
        {peopleAhead} ahead x {averageMinutes} min ÷ {openCounters} open{" "}
        {openCounters === 1 ? "counter" : "counters"}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">≈ {formatMinutes(estimateMinutes)}</p>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        The average comes from the last 20 completed {""}
        services of this type, so it follows how fast the counters are moving today.
      </p>
    </div>
  );
}

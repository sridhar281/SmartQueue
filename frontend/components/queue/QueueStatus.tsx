import { formatMinutes } from "@/lib/utils";

/** Compact summary strip used at the top of the customer dashboard. */
export function QueueStatus({
  waiting, nowServing, estimate,
}: { waiting: number; nowServing: string | null; estimate: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <Item label="In line now" value={String(waiting)} />
      <Item label="Now serving" value={nowServing ?? "—"} mono />
      <Item label="Typical wait" value={formatMinutes(estimate)} />
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

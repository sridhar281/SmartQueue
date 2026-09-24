import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, hint, icon: Icon, tone = "neutral",
}: {
  label: string; value: string | number; hint?: string;
  icon: LucideIcon; tone?: "neutral" | "positive" | "warning";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-500",
    positive: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

import { cn, STATUS_STYLES } from "@/lib/utils";

/** A status pill. Colour is driven by the status string itself. */
export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-200",
      className
    )}>
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Empty screens are an invitation to act, so every one offers a next step. */
export function EmptyState({
  icon: Icon, title, description, actionLabel, onAction,
}: {
  icon: LucideIcon; title: string; description: string;
  actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-white p-3 ring-1 ring-slate-200">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

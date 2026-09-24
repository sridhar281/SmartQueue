import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "38 minutes" -> "38 min", "95" -> "1 h 35 min". Used all over the queue UI. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "Next up";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export const STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-50 text-amber-700 ring-amber-200",
  CALLED: "bg-brand-50 text-brand-700 ring-brand-200",
  SERVING: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-600 ring-slate-200",
  SKIPPED: "bg-orange-50 text-orange-700 ring-orange-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OFFLINE: "bg-slate-100 text-slate-500 ring-slate-200",
  SCHEDULED: "bg-brand-50 text-brand-700 ring-brand-200",
  CHECKED_IN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  MISSED: "bg-rose-50 text-rose-700 ring-rose-200",
};

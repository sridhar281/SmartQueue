"use client";
import { Wifi, WifiOff } from "lucide-react";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type { Notification } from "@/hooks/useNotifications";
import { MobileNav } from "./MobileNav";

/** Top bar: page title, live-connection indicator, notifications. */
export function Header({
  title, subtitle, connected, notifications, unread, onOpenNotifications,
}: {
  title: string;
  subtitle?: string;
  connected: boolean;
  notifications: Notification[];
  unread: number;
  onOpenNotifications: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <MobileNav />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>

      <span
        title={connected ? "Live updates on" : "Reconnecting"}
        className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex ${
          connected
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-slate-100 text-slate-500 ring-slate-200"
        }`}
      >
        {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {connected ? "Live" : "Reconnecting"}
      </span>

      <NotificationPanel items={notifications} unread={unread} onOpen={onOpenNotifications} />
    </header>
  );
}

"use client";
import { useState } from "react";
import { Bell, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

const ICONS = { info: Info, success: CheckCircle2, warning: TriangleAlert };
const TONES = { info: "text-brand-600", success: "text-emerald-600", warning: "text-amber-600" };

export function NotificationPanel({
  items, unread, onOpen,
}: { items: Notification[]; unread: number; onOpen: () => void }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) onOpen();
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
              Notifications
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                Queue updates will appear here.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {items.map((item) => {
                  const Icon = ICONS[item.tone];
                  return (
                    <li key={item.id} className="flex gap-3 px-4 py-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONES[item.tone]}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700">{item.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

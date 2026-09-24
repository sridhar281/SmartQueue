"use client";

/**
 * Wraps every signed-in page: sidebar + header + one live WebSocket.
 *
 * The socket lives here rather than in each page so a customer keeps receiving
 * "your token was called" while browsing Services or Appointments.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useQueueSocket } from "@/hooks/useQueueSocket";
import { useNotifications } from "@/hooks/useNotifications";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({
  title, subtitle, requireAdmin = false, onQueueEvent, children,
}: {
  title: string;
  subtitle?: string;
  requireAdmin?: boolean;
  onQueueEvent?: () => void;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const notifications = useNotifications();

  // Route protection. The backend enforces this too - this is only so the user
  // sees the right screen, never the security boundary.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (requireAdmin && user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, requireAdmin, router]);

  const rooms = user
    ? user.role === "admin" ? ["admin"] : [`user:${user.id}`, "admin"]
    : [];

  const { connected } = useQueueSocket(rooms, (event) => {
    if (event.event === "connected" || event.event === "pong") return;
    notifications.fromEvent(event);
    onQueueEvent?.();  // page refetches over REST: the socket only says "something changed"
  });

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Loading SmartQueue…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          connected={connected}
          notifications={notifications.items}
          unread={notifications.unread}
          onOpenNotifications={notifications.markAllRead}
        />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

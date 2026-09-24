"use client";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Ticket, TicketCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { TokenCard } from "@/components/queue/TokenCard";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate, formatMinutes } from "@/lib/utils";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const token = useApi(() => api.myToken(), []);
  const history = useApi(() => api.myHistory(), []);
  const appointments = useApi(() => api.appointments(), []);

  const refreshAll = () => { token.refetch(); history.refetch(); };
  const nextAppointment = appointments.data?.find((a) => a.status === "SCHEDULED");
  const completed = history.data?.filter((t) => t.status === "COMPLETED").length ?? 0;

  return (
    <AppShell
      title={`Good to see you, ${user?.name.split(" ")[0] ?? ""}`}
      subtitle="Everything about your queue, in one place."
      onQueueEvent={refreshAll}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {token.loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={Ticket} label="Active token"
                value={token.data?.token_number ?? "None"}
                hint={token.data ? token.data.service_name : "Take one from Services"} />
              <StatCard icon={Clock} label="Estimated wait" tone={token.data ? "warning" : "neutral"}
                value={token.data ? formatMinutes(token.data.estimated_wait_minutes) : "—"}
                hint={token.data ? `${token.data.people_ahead} ahead of you` : "Nothing in progress"} />
              <StatCard icon={CalendarDays} label="Next appointment"
                value={nextAppointment ? formatDate(nextAppointment.appointment_date) : "None"}
                hint={nextAppointment?.service_name ?? "Book one in Appointments"} />
              <StatCard icon={TicketCheck} label="Visits completed" tone="positive"
                value={completed} hint="Across all services" />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {token.loading ? (
              <SkeletonCard />
            ) : token.data ? (
              <TokenCard token={token.data} />
            ) : (
              <EmptyState
                icon={Ticket}
                title="No active queue"
                description="You aren't waiting for anything right now. Pick a service to take a token."
                actionLabel="Browse services"
                onAction={() => router.push("/services")}
              />
            )}
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
              <div className="mt-4 grid gap-2">
                <Button variant="secondary" onClick={() => router.push("/services")}>Take a token</Button>
                <Button variant="secondary" onClick={() => router.push("/appointments")}>Book an appointment</Button>
                <Button variant="ghost" onClick={() => router.push("/history")}>View past visits</Button>
              </div>
            </div>

            {history.data && history.data.length > 0 && <ActivityCard tokens={history.data} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

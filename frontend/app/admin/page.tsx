"use client";
import {
  Ban, CheckCircle2, Clock, Hourglass, MonitorCog, Timer, TrendingUp, Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { QueueChart, CounterChart } from "@/components/dashboard/QueueChart";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const overview = useApi(() => api.overview(), []);
  const hourly = useApi(() => api.hourly(), []);
  const serviceStats = useApi(() => api.serviceStats(), []);
  const counterStats = useApi(() => api.counterStats(), []);

  const refresh = () => { overview.refetch(); hourly.refetch(); counterStats.refetch(); };

  return (
    <AppShell title="Today at a glance" subtitle="Live numbers from the floor." requireAdmin onQueueEvent={refresh}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overview.loading || !overview.data ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={Users} label="Tokens today" value={overview.data.tokens_today} />
              <StatCard icon={Hourglass} label="Waiting now" value={overview.data.waiting_now} tone="warning" />
              <StatCard icon={Timer} label="Being served" value={overview.data.serving_now} tone="positive" />
              <StatCard icon={CheckCircle2} label="Completed today" value={overview.data.completed_today} tone="positive" />
              <StatCard icon={Clock} label="Average wait"
                value={`${overview.data.avg_waiting_minutes} min`} hint="From joining to being called" />
              <StatCard icon={Timer} label="Average service"
                value={`${overview.data.avg_service_minutes} min`} hint="Time spent at the counter" />
              <StatCard icon={MonitorCog} label="Counters open" value={overview.data.active_counters} />
              <StatCard icon={Ban} label="Cancelled today" value={overview.data.cancelled_today} />
            </>
          )}
        </div>

        {overview.data?.peak_hour && (
          <p className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            Busiest hour so far today is {overview.data.peak_hour}. Consider opening an extra counter around then.
          </p>
        )}

        {hourly.loading ? <Skeleton className="h-80 rounded-xl" /> : <QueueChart data={hourly.data ?? []} />}

        <div className="grid gap-6 lg:grid-cols-2">
          {serviceStats.loading ? <Skeleton className="h-80 rounded-xl" /> : <ServiceChart data={serviceStats.data ?? []} />}
          {counterStats.loading ? <Skeleton className="h-72 rounded-xl" /> : <CounterChart data={counterStats.data ?? []} />}
        </div>
      </div>
    </AppShell>
  );
}

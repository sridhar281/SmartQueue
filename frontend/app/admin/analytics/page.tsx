"use client";
import { AppShell } from "@/components/layout/AppShell";
import { QueueChart, CounterChart } from "@/components/dashboard/QueueChart";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const hourly = useApi(() => api.hourly(), []);
  const serviceStats = useApi(() => api.serviceStats(), []);
  const counterStats = useApi(() => api.counterStats(), []);

  return (
    <AppShell title="Analytics" subtitle="Where the time actually goes." requireAdmin>
      <div className="space-y-6">
        {hourly.loading ? <Skeleton className="h-80 rounded-xl" /> : <QueueChart data={hourly.data ?? []} />}
        {serviceStats.loading ? <Skeleton className="h-80 rounded-xl" /> : <ServiceChart data={serviceStats.data ?? []} />}
        {counterStats.loading ? <Skeleton className="h-72 rounded-xl" /> : <CounterChart data={counterStats.data ?? []} />}

        {serviceStats.data && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Completed (7 days)</th>
                  <th className="px-4 py-3 font-medium">Avg service time</th>
                  <th className="px-4 py-3 font-medium">Avg wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceStats.data.map((row) => (
                  <tr key={row.service_id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.service_name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.completed}</td>
                    <td className="px-4 py-3 text-slate-600">{row.avg_service_minutes} min</td>
                    <td className="px-4 py-3 text-slate-600">{row.avg_wait_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

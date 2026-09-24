"use client";
import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";

const STATUSES = ["COMPLETED", "CANCELLED", "SKIPPED", "WAITING"];

export default function HistoryPage() {
  const tokens = useApi(() => api.myHistory(), []);
  const services = useApi(() => api.services(true), []);
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [month, setMonth] = useState("");

  // Filtering happens client-side because a customer's history is small.
  const filtered = useMemo(() => {
    return (tokens.data ?? []).filter((token) => {
      if (status && token.status !== status) return false;
      if (serviceId && String(token.service_id) !== serviceId) return false;
      if (month && !token.created_at.startsWith(month)) return false;
      return true;
    });
  }, [tokens.data, status, serviceId, month]);

  /** Waiting time = joined the queue -> called to a counter. */
  const waitedMinutes = (createdAt: string, calledAt: string | null) =>
    calledAt ? Math.round((+new Date(calledAt) - +new Date(createdAt)) / 60000) : null;

  /** Service duration = started at the counter -> completed. */
  const servedMinutes = (startedAt: string | null, completedAt: string | null) =>
    startedAt && completedAt ? Math.round((+new Date(completedAt) - +new Date(startedAt)) / 60000) : null;

  return (
    <AppShell title="History" subtitle="Every visit, what it was for, and how long it took.">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </Select>
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} aria-label="Filter by service">
            <option value="">All services</option>
            {services.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Filter by month"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>

        {tokens.loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="Nothing matches these filters"
            description="Try clearing a filter, or take a token and come back after your visit." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Waited</th>
                  <th className="px-4 py-3 font-medium">Service time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((token) => {
                  const waited = waitedMinutes(token.created_at, token.called_at);
                  const served = servedMinutes(token.started_at, token.completed_at);
                  return (
                    <tr key={token.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-slate-900">{token.token_number}</td>
                      <td className="px-4 py-3 text-slate-700">{token.service_name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(token.created_at)} · {formatTime(token.created_at)}
                      </td>
                      <td className="px-4 py-3"><Badge status={token.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{waited !== null ? `${waited} min` : "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{served !== null ? `${served} min` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";
import { useState } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { api } from "@/lib/api";
import type { SimulationResult } from "@/types";

/** "What if we opened another counter?" - arithmetic, clearly labelled as such. */
export default function SimulationPage() {
  const [form, setForm] = useState({ counters: 3, customers: 60, avg_service_minutes: 9 });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.simulate(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run the simulation.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: Number(e.target.value) });

  const baseline = result?.baseline;

  return (
    <AppShell title="Counter simulation" subtitle="Compare staffing options before you commit." requireAdmin>
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="sim-counters">Counters open now</Label>
              <Input id="sim-counters" type="number" min={1} max={12} value={form.counters} onChange={field("counters")} />
            </div>
            <div>
              <Label htmlFor="sim-customers">Customers expected</Label>
              <Input id="sim-customers" type="number" min={1} max={500} value={form.customers} onChange={field("customers")} />
            </div>
            <div>
              <Label htmlFor="sim-avg">Average service time (min)</Label>
              <Input id="sim-avg" type="number" min={1} max={120} value={form.avg_service_minutes} onChange={field("avg_service_minutes")} />
            </div>
          </div>
          <Button className="mt-4" loading={loading} onClick={run}>Run simulation</Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {result && (
          <>
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
              {result.note}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Counters today" value={String(baseline!.counters)} />
              <Metric label="Average wait today" value={`${baseline!.avg_wait_minutes} min`} />
              <Metric label="Last customer waits" value={`${baseline!.last_customer_wait_minutes} min`} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Average wait by number of counters</h3>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.scenarios} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="counters" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis unit="m" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Line dataKey="avg_wait_minutes" name="Average wait" stroke="#254deb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Counters</th>
                    <th className="px-4 py-3 font-medium">Average wait</th>
                    <th className="px-4 py-3 font-medium">Last customer waits</th>
                    <th className="px-4 py-3 font-medium">Customers per hour</th>
                    <th className="px-4 py-3 font-medium">Change vs today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.scenarios.map((row) => {
                    const delta = row.avg_wait_minutes - baseline!.avg_wait_minutes;
                    const current = row.counters === baseline!.counters;
                    return (
                      <tr key={row.counters} className={current ? "bg-brand-50/40" : ""}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {row.counters}{current && <span className="ml-2 text-xs text-brand-700">today</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.avg_wait_minutes} min</td>
                        <td className="px-4 py-3 text-slate-600">{row.last_customer_wait_minutes} min</td>
                        <td className="px-4 py-3 text-slate-600">{row.throughput_per_hour}</td>
                        <td className={`px-4 py-3 font-medium ${delta < 0 ? "text-emerald-700" : delta > 0 ? "text-rose-700" : "text-slate-400"}`}>
                          {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} min`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

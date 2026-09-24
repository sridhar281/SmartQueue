"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ServiceStat } from "@/types";

/** Which services people actually use, and how long each one takes. */
export function ServiceChart({ data }: { data: ServiceStat[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Services completed this week</h3>
      <p className="mt-0.5 text-xs text-slate-500">Useful for deciding where to add staff.</p>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="service_name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0}
              tickLine={false} axisLine={false} angle={-12} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="completed" name="Completed" fill="#3b6bf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg_service_minutes" name="Avg service (min)" fill="#bfd3fe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";
import {
  Bar, BarChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { HourlyPoint } from "@/types";

/** Tokens taken each hour, with average waiting time overlaid as a line. */
export function QueueChart({ data }: { data: HourlyPoint[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Tokens and waiting time by hour</h3>
      <p className="mt-0.5 text-xs text-slate-500">Bars are tokens taken; the line is average wait in minutes.</p>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            />
            <Bar dataKey="tokens" name="Tokens" fill="#93b4fd" radius={[4, 4, 0, 0]} />
            <Line dataKey="avg_wait_minutes" name="Avg wait (min)" stroke="#254deb" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Simple horizontal bar chart of counter utilisation. */
export function CounterChart({ data }: { data: { counter_name: string; utilisation_percent: number }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Counter utilisation</h3>
      <p className="mt-0.5 text-xs text-slate-500">Share of an 8-hour shift spent serving customers.</p>

      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
            <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="counter_name" width={80}
              tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="utilisation_percent" name="Utilisation" fill="#3b6bf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

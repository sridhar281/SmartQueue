"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import type { QueueToken } from "@/types";

/** The admin's live queue, in exactly the order customers will be called. */
export function QueueList({
  tokens, onSkip, busyId,
}: { tokens: QueueToken[]; onSkip?: (id: number) => void; busyId?: number | null }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Token</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Customer</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Service</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Joined</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {onSkip && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tokens.map((token, index) => (
            <tr key={token.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 text-slate-400">{index + 1}</td>
              <td className="px-4 py-3">
                <span className="font-mono font-medium text-slate-900">{token.token_number}</span>
                {token.priority > 0 && (
                  <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                    priority
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{token.customer_name}</td>
              <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{token.service_name}</td>
              <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{formatTime(token.created_at)}</td>
              <td className="px-4 py-3"><Badge status={token.status} /></td>
              {onSkip && (
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm" variant="ghost"
                    loading={busyId === token.id}
                    onClick={() => onSkip(token.id)}
                  >
                    Skip
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

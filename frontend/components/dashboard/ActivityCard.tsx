import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { QueueToken } from "@/types";

export function ActivityCard({ tokens }: { tokens: QueueToken[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {tokens.slice(0, 5).map((token) => (
          <li key={token.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className="font-mono text-sm text-slate-900">{token.token_number}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-700">{token.service_name}</p>
              <p className="text-xs text-slate-400">
                {formatDate(token.created_at)} · {formatTime(token.created_at)}
              </p>
            </div>
            <Badge status={token.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

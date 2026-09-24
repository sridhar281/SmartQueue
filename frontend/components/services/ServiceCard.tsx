"use client";
import { Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({
  service, onTakeToken, onBook, busy, disabled,
}: {
  service: Service;
  onTakeToken: (service: Service) => void;
  onBook?: (service: Service) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const quiet = service.waiting_count <= 2;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-slate-900">{service.name}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
          quiet ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
        }`}>
          {quiet ? "Quiet" : "Busy"}
        </span>
      </div>

      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{service.description}</p>

      <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-slate-600">
          <Users className="h-4 w-4 text-slate-400" /> {service.waiting_count} waiting
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" /> ~{formatMinutes(service.estimated_wait_minutes)}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" loading={busy} disabled={disabled} onClick={() => onTakeToken(service)}>
          Take a token
        </Button>
        {onBook && (
          <Button variant="secondary" onClick={() => onBook(service)}>Book a time</Button>
        )}
      </div>
    </div>
  );
}

"use client";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

export function AppointmentCard({
  appointment, onCheckIn, onCancel, busy,
}: {
  appointment: Appointment;
  onCheckIn: (id: number) => void;
  onCancel: (id: number) => void;
  busy?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const canCheckIn = appointment.status === "SCHEDULED" && appointment.appointment_date === today;
  const canCancel = appointment.status === "SCHEDULED";

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-slate-900">{appointment.service_name}</h3>
          <Badge status={appointment.status} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatDate(appointment.appointment_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {appointment.appointment_time.slice(0, 5)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {canCheckIn && (
          <Button size="sm" loading={busy} onClick={() => onCheckIn(appointment.id)}>Check in</Button>
        )}
        {canCancel && (
          <Button size="sm" variant="ghost" onClick={() => onCancel(appointment.id)}>Cancel</Button>
        )}
      </div>
    </div>
  );
}

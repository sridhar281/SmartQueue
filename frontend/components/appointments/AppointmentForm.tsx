"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import type { Service } from "@/types";

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function AppointmentForm({
  services, onSubmit, onCancel,
}: {
  services: Service[];
  onSubmit: (data: { service_id: number; appointment_date: string; appointment_time: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? 0);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState(SLOTS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ service_id: Number(serviceId), appointment_date: date, appointment_time: `${time}:00` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book this slot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <Label htmlFor="ap-service">Service</Label>
        <Select id="ap-service" value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ap-date">Date</Label>
          <Input id="ap-date" type="date" min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ap-time">Time</Label>
          <Select id="ap-time" value={time} onChange={(e) => setTime(e.target.value)}>
            {SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </Select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Check in on the day and you'll be placed ahead of walk-ins who arrive at the same time.
      </p>

      {error && <ErrorMessage message={error} />}

      <div className="flex gap-2">
        <Button loading={saving} onClick={book}>Book appointment</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

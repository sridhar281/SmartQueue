"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

export default function AppointmentsPage() {
  const router = useRouter();
  const appointments = useApi(() => api.appointments(), []);
  const services = useApi(() => api.services(), []);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const book = async (data: { service_id: number; appointment_date: string; appointment_time: string }) => {
    await api.bookAppointment(data);
    setShowForm(false);
    appointments.refetch();
  };

  const checkIn = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await api.checkIn(id);
      router.push("/my-queue");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check you in.");
      setBusyId(null);
    }
  };

  const cancel = async (id: number) => {
    setError(null);
    try {
      await api.updateAppointment(id, { status: "CANCELLED" });
      appointments.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this appointment.");
    }
  };

  return (
    <AppShell title="Appointments" subtitle="Book a slot and skip the walk-in queue.">
      <div className="space-y-5">
        <div className="flex justify-end">
          {!showForm && services.data?.length ? (
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Book appointment</Button>
          ) : null}
        </div>

        {showForm && services.data && (
          <AppointmentForm services={services.data} onSubmit={book} onCancel={() => setShowForm(false)} />
        )}

        {error && <ErrorMessage message={error} />}

        {appointments.loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : appointments.data?.length ? (
          <div className="space-y-3">
            {appointments.data.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment}
                busy={busyId === appointment.id} onCheckIn={checkIn} onCancel={cancel} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="You don't have any appointments yet"
            description="Book a time slot and check in when you arrive to be placed ahead of walk-ins."
            actionLabel="Book your first appointment" onAction={() => setShowForm(true)} />
        )}
      </div>
    </AppShell>
  );
}

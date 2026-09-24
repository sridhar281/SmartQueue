"use client";
import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { QueueList } from "@/components/queue/QueueList";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

export default function AdminQueuePage() {
  const [serviceId, setServiceId] = useState("");
  const services = useApi(() => api.services(), []);
  const queue = useApi(() => api.queueStatus(serviceId ? Number(serviceId) : undefined), [serviceId]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skip = async (tokenId: number) => {
    setBusyId(tokenId);
    setError(null);
    try {
      await api.skipToken(tokenId, "Customer not present");
      queue.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not skip this customer.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Live queue" subtitle="In the exact order customers will be called."
      requireAdmin onQueueEvent={queue.refetch}>
      <div className="space-y-5">
        <Select className="max-w-xs" value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          aria-label="Filter by service">
          <option value="">All services</option>
          {services.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>

        {error && <ErrorMessage message={error} />}

        {queue.loading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : queue.data?.length ? (
          <QueueList tokens={queue.data} onSkip={skip} busyId={busyId} />
        ) : (
          <EmptyState icon={ListOrdered} title="Nobody is waiting"
            description="The queue is empty. New tokens will appear here the moment they're taken." />
        )}
      </div>
    </AppShell>
  );
}

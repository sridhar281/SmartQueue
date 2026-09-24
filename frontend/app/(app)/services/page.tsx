"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceCard } from "@/components/services/ServiceCard";
import { QueueStatus } from "@/components/queue/QueueStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { Service } from "@/types";

export default function ServicesPage() {
  const router = useRouter();
  const services = useApi(() => api.services(), []);
  const myToken = useApi(() => api.myToken(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takeToken = async (service: Service) => {
    setBusyId(service.id);
    setError(null);
    try {
      await api.takeToken(service.id);
      router.push("/my-queue");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take a token.");
      setBusyId(null);
    }
  };

  const totalWaiting = services.data?.reduce((sum, s) => sum + s.waiting_count, 0) ?? 0;

  return (
    <AppShell title="Services" subtitle="Live queue length for every desk."
      onQueueEvent={() => { services.refetch(); myToken.refetch(); }}>
      <div className="space-y-6">
        {!services.loading && services.data && (
          <QueueStatus
            waiting={totalWaiting}
            nowServing={myToken.data?.now_serving ?? null}
            estimate={Math.round(
              services.data.reduce((sum, s) => sum + s.estimated_wait_minutes, 0) /
              Math.max(services.data.length, 1)
            )}
          />
        )}

        {myToken.data && (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
            You already hold {myToken.data.token_number}. Finish or leave that queue before taking another token.
          </p>
        )}

        {error && <ErrorMessage message={error} />}

        {services.loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : services.data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.data.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                busy={busyId === service.id}
                disabled={Boolean(myToken.data)}
                onTakeToken={takeToken}
                onBook={() => router.push("/appointments")}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No services yet"
            description="An administrator hasn't set up any services. Check back shortly." />
        )}
      </div>
    </AppShell>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TokenCard } from "@/components/queue/TokenCard";
import { WaitTimeCard } from "@/components/queue/WaitTimeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

/** The live token page. Designed phone-first: this is what people watch. */
export default function MyQueuePage() {
  const router = useRouter();
  const token = useApi(() => api.myToken(), []);
  const services = useApi(() => api.services(), []);
  const counters = useApi(() => api.counters().catch(() => []), []);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = services.data?.find((s) => s.id === token.data?.service_id);
  const openCounters = counters.data?.filter((c) => c.status !== "OFFLINE").length ?? 1;

  const cancel = async () => {
    if (!token.data) return;
    setCancelling(true);
    setError(null);
    try {
      await api.cancelToken(token.data.id);
      await token.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this token.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AppShell title="My queue" subtitle="Updates by itself — no need to refresh."
      onQueueEvent={() => { token.refetch(); services.refetch(); }}>
      {token.loading ? (
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : !token.data ? (
        <EmptyState icon={Ticket} title="No active queue"
          description="You aren't in line right now. Take a token and this page will track it live."
          actionLabel="Browse services" onAction={() => router.push("/services")} />
      ) : (
        <div className="mx-auto max-w-xl space-y-4">
          <TokenCard token={token.data} />

          <WaitTimeCard
            peopleAhead={token.data.people_ahead}
            averageMinutes={service?.average_service_minutes ?? service?.average_duration ?? 10}
            openCounters={Math.max(openCounters, 1)}
            estimateMinutes={token.data.estimated_wait_minutes}
          />

          {error && <ErrorMessage message={error} />}

          {token.data.status === "WAITING" && (
            <Button variant="secondary" className="w-full" loading={cancelling} onClick={cancel}>
              Leave the queue
            </Button>
          )}
        </div>
      )}
    </AppShell>
  );
}

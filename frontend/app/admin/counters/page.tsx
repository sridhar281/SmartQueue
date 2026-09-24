"use client";
import { useState } from "react";
import { MonitorCog, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CounterCard } from "@/components/counters/CounterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { Counter } from "@/types";

/** The screen staff keep open all day. */
export default function AdminCountersPage() {
  const counters = useApi(() => api.counters(), []);
  const queue = useApi(() => api.queueStatus(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = () => { counters.refetch(); queue.refetch(); };

  /** Every counter action funnels through here so errors are handled once. */
  const run = async (counterId: number, action: () => Promise<unknown>) => {
    setBusyId(counterId);
    setError(null);
    try {
      await action();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action didn't go through.");
    } finally {
      setBusyId(null);
    }
  };

  /** Find the token this counter is holding so we can complete or skip it. */
  const activeTokenId = (counter: Counter) =>
    queue.data?.find((t) => t.counter_id === counter.id && ["CALLED", "SERVING"].includes(t.status))?.id;

  const addCounter = async () => {
    setAdding(true);
    setError(null);
    try {
      await api.createCounter(newName.trim());
      setNewName("");
      counters.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this counter.");
    } finally {
      setAdding(false);
    }
  };

  const waiting = queue.data?.filter((t) => t.status === "WAITING").length ?? 0;

  return (
    <AppShell title="Counters" subtitle={`${waiting} ${waiting === 1 ? "person" : "people"} waiting right now`}
      requireAdmin onQueueEvent={refresh}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Input className="max-w-xs" value={newName} placeholder="Counter 4"
            onChange={(e) => setNewName(e.target.value)} aria-label="New counter name" />
          <Button loading={adding} disabled={!newName.trim()} onClick={addCounter}>
            <Plus className="h-4 w-4" /> Add counter
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {counters.loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
          </div>
        ) : counters.data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {counters.data.map((counter) => (
              <CounterCard
                key={counter.id}
                counter={counter}
                busy={busyId === counter.id}
                onOpen={() => run(counter.id, () => api.updateCounter(counter.id, { status: "AVAILABLE" }))}
                onClose={() => run(counter.id, () => api.updateCounter(counter.id, { status: "OFFLINE" }))}
                onCallNext={() => run(counter.id, () => api.callNext(counter.id))}
                onComplete={() => {
                  const id = activeTokenId(counter);
                  if (id) run(counter.id, () => api.completeService(id));
                }}
                onSkip={() => {
                  const id = activeTokenId(counter);
                  if (id) run(counter.id, () => api.skipToken(id, "Customer not present"));
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={MonitorCog} title="No counters yet"
            description="Add your first counter above, then open it to start calling customers." />
        )}
      </div>
    </AppShell>
  );
}

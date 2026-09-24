"use client";
import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceForm } from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { Service } from "@/types";

export default function AdminServicesPage() {
  const services = useApi(() => api.services(true), []);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: { name: string; description: string; average_duration: number }) => {
    await api.createService(data);
    setCreating(false);
    services.refetch();
  };

  const update = async (data: { name: string; description: string; average_duration: number }) => {
    if (!editing) return;
    await api.updateService(editing.id, data);
    setEditing(null);
    services.refetch();
  };

  const toggleActive = async (service: Service) => {
    setError(null);
    try {
      // Deactivating is a soft delete: history rows keep pointing at a real service.
      if (service.active) await api.deactivateService(service.id);
      else await api.updateService(service.id, { active: true });
      services.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this service.");
    }
  };

  return (
    <AppShell title="Services" subtitle="What customers can queue for." requireAdmin>
      <div className="space-y-5">
        <div className="flex justify-end">
          {!creating && !editing && (
            <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New service</Button>
          )}
        </div>

        {creating && <ServiceForm onSubmit={create} onCancel={() => setCreating(false)} />}
        {editing && (
          <ServiceForm
            initial={{ name: editing.name, description: editing.description, average_duration: editing.average_duration }}
            onSubmit={update}
            onCancel={() => setEditing(null)}
          />
        )}

        {error && <ErrorMessage message={error} />}

        {services.loading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : services.data?.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Expected</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Measured</th>
                  <th className="px-4 py-3 font-medium">Waiting</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.data.map((service) => (
                  <tr key={service.id} className={service.active ? "" : "opacity-60"}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.description}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{service.average_duration} min</td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{service.average_service_minutes} min</td>
                    <td className="px-4 py-3 text-slate-600">{service.waiting_count}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        service.active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-500 ring-slate-200"
                      }`}>
                        {service.active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(service)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(service)}>
                        {service.active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Settings2} title="No services yet"
            description="Create your first service so customers have something to queue for."
            actionLabel="Create a service" onAction={() => setCreating(true)} />
        )}
      </div>
    </AppShell>
  );
}

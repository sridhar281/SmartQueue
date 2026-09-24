"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export function ServiceForm({
  initial, onSubmit, onCancel,
}: {
  initial?: { name: string; description: string; average_duration: number };
  onSubmit: (data: { name: string; description: string; average_duration: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.average_duration ?? 10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, description, average_duration: Number(duration) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this service.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <Label htmlFor="svc-name">Service name</Label>
        <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Document Verification" />
      </div>
      <div>
        <Label htmlFor="svc-desc">What happens at this desk</Label>
        <Input id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Verify identity and address documents." />
      </div>
      <div>
        <Label htmlFor="svc-dur">Expected minutes per customer</Label>
        <Input id="svc-dur" type="number" min={1} max={240} value={duration}
          onChange={(e) => setDuration(Number(e.target.value))} />
        <p className="mt-1 text-xs text-slate-500">
          Used until there is enough real history; after that, measured times take over.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex gap-2">
        <Button loading={saving} onClick={save} disabled={!name.trim()}>Save service</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

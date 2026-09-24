"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Create an account</h1>
      <p className="mt-1 text-sm text-slate-500">Take your first token in under a minute.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required minLength={2} value={form.name} onChange={update("name")} placeholder="Aarav Sharma" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={form.password} onChange={update("password")} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" className="w-full" loading={loading}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

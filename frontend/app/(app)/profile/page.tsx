"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <AppShell title="Profile" subtitle="Your account details.">
      <div className="max-w-lg space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
              {user?.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-[15px] font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium capitalize text-slate-900">{user?.role}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-500">Member since</dt>
              <dd className="font-medium text-slate-900">{user && formatDate(user.created_at)}</dd>
            </div>
          </dl>
        </div>

        <Button variant="secondary" onClick={logout}>Sign out</Button>
      </div>
    </AppShell>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { adminNav, customerNav } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = user?.role === "admin" ? adminNav : customerNav;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white p-3 shadow-xl">
            <div className="flex h-12 items-center justify-between px-2">
              <span className="font-semibold text-slate-900">SmartQueue</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-2 space-y-1">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    pathname === href ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600"
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </nav>
            <button onClick={logout} className="mt-4 w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600">
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

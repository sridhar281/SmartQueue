import Link from "next/link";

/** Shared frame for sign in / register / forgot password. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">SQ</span>
          <span className="font-semibold tracking-tight text-slate-900">SmartQueue</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

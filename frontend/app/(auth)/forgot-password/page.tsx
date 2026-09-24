"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/**
 * Sending real reset emails needs mail infrastructure, which this version
 * deliberately does not include. The screen is honest about that instead of
 * pretending to send something.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-7">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Check with your administrator</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Email delivery isn't set up in this deployment, so resets are done by an administrator.
          Ask them to reset the password for <span className="font-medium text-slate-900">{email}</span>.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">Tell us which account needs resetting.</p>

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Continue</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}

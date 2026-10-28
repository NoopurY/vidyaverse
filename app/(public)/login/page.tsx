"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Field, Input } from "@/components/ui";
import { api } from "@/lib/fetcher";

const HOME: Record<string, string> = { AICTE_ADMIN: "/aicte", INSTITUTION: "/institution", STUDENT: "/student" };
const DEMO = [
  ["admin@aicte.demo", "AICTE HQ admin"],
  ["regional@aicte.demo", "Regional officer (Western)"],
  ["regulator@aicte.demo", "Read-only regulator"],
  ["institute@demo", "Institution admin"],
  ["operator@demo", "Institution operator"],
  ["student@demo", "Student"],
];

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<{ challengeId: string; otpRequired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("reason") === "idle" ? "You were signed out after 15 minutes of inactivity." : null);

  const finish = async (challengeId: string, code: string) => {
    const r = await signIn("credentials", { challengeId, otp: code, redirect: false });
    if (r?.error) throw new Error("Incorrect or expired OTP");
    const s = await getSession();
    const next = params.get("callbackUrl");
    window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : HOME[s?.user?.role ?? ""] ?? "/";
  };

  const step1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ challengeId: string; otpRequired: boolean; devOtp?: string }>("/api/auth/otp", "POST", { email, password });
      if (!r.otpRequired) return await finish(r.challengeId, "");
      setChallenge(r);
      if (r.devOtp) toast.info(`Demo OTP: ${r.devOtp}`, { description: "Mock SMS – also printed in the server console", duration: 30000 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const step2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await finish(challenge!.challengeId, otp);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[1fr_340px]">
      <Card className="p-6 md:p-8">
        <h1 className="page-title flex items-center gap-2">
          <LockKeyhole className="h-6 w-6 text-navy" aria-hidden /> Secure login
        </h1>
        <p className="mt-1 text-sm text-muted">AICTE and institution users confirm with a one-time password (OTP).</p>
        {error && (
          <p role="alert" className="mt-4 rounded border border-[#F3B9B9] bg-[#FDECEC] px-3 py-2 text-sm text-[#9E1C1C]">
            {error}
          </p>
        )}
        {!challenge ? (
          <form onSubmit={step1} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Continue
            </Button>
            <p className="text-xs text-muted">Accounts lock for 15 minutes after 5 failed attempts.</p>
          </form>
        ) : (
          <form onSubmit={step2} className="mt-6 space-y-4">
            <Field label="One-time password" htmlFor="otp" hint="Enter the 6-digit OTP sent to your registered mobile.">
              <Input id="otp" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="text-center text-lg tracking-[0.5em]" />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              <KeyRound className="h-4 w-4" aria-hidden /> Verify & sign in
            </Button>
            <button type="button" className="text-sm text-navy hover:underline" onClick={() => { setChallenge(null); setOtp(""); }}>
              Use a different account
            </button>
          </form>
        )}
      </Card>
      <Card className="p-5">
        <p className="font-semibold">Demo accounts</p>
        <p className="mt-1 text-xs text-muted">Password for all: Demo@123. Click to fill.</p>
        <ul className="mt-3 space-y-1">
          {DEMO.map(([e, label]) => (
            <li key={e}>
              <button type="button" onClick={() => { setEmail(e); setPassword("Demo@123"); setChallenge(null); }} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-navy-tint">
                <span className="block font-medium text-navy">{label}</span>
                <span className="block text-xs text-muted">{e}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

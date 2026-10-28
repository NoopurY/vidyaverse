"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { AlertTriangle, Building2, Eye, EyeOff, GraduationCap, KeyRound, Landmark, LockKeyhole, MapPinned, ShieldCheck, UserCog } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { api } from "@/lib/fetcher";

const HOME: Record<string, string> = { AICTE_ADMIN: "/aicte", INSTITUTION: "/institution", STUDENT: "/student" };
const DEMO_PASSWORD = "Demo@123";
const DEMO = [
  { email: "admin@aicte.demo", label: "AICTE HQ Admin", hint: "Full access", icon: Landmark },
  { email: "regional@aicte.demo", label: "Regional Officer", hint: "Western region only", icon: MapPinned },
  { email: "regulator@aicte.demo", label: "Regulator", hint: "Read-only, aggregated", icon: ShieldCheck },
  { email: "institute@demo", label: "Institution Admin", hint: "Pune Institute of Engg.", icon: Building2 },
  { email: "operator@demo", label: "Institution Operator", hint: "Upload & edit", icon: UserCog },
  { email: "student@demo", label: "Student", hint: "Aarav Sharma", icon: GraduationCap },
];

type Health = { ok: boolean; db: boolean; seeded: boolean; demo: boolean; message?: string };

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpAutofilled, setOtpAutofilled] = useState(false);
  const [challenge, setChallenge] = useState<{ challengeId: string; otpRequired: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(params.get("reason") === "idle" ? "You were signed out after 15 minutes of inactivity." : null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, db: false, seeded: false, demo: false, message: "Server not reachable" }));
  }, []);

  const finish = async (challengeId: string, code: string) => {
    const r = await signIn("credentials", { challengeId, otp: code, redirect: false });
    if (r?.error) throw new Error("Incorrect or expired OTP. Click “Use a different account” and try again.");
    const s = await getSession();
    const next = params.get("callbackUrl");
    window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : HOME[s?.user?.role ?? ""] ?? "/";
  };

  const start = async (em: string, pw: string, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const r = await api<{ challengeId: string; otpRequired: boolean; devOtp?: string }>("/api/auth/otp", "POST", { email: em.trim().toLowerCase(), password: pw });
      if (!r.otpRequired) return await finish(r.challengeId, "");
      setChallenge(r);
      setOtp(r.devOtp ?? "");
      setOtpAutofilled(!!r.devOtp);
      setBusy(null);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  const quickLogin = (em: string) => {
    setEmail(em);
    setPassword(DEMO_PASSWORD);
    setChallenge(null);
    start(em, DEMO_PASSWORD, em);
  };

  const step2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("otp");
    setError(null);
    try {
      await finish(challenge!.challengeId, otp.trim());
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  const dbProblem = health && (!health.db || !health.seeded);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[1fr_380px]">
      <Card className="p-6 md:p-8">
        <h1 className="page-title flex items-center gap-2">
          <LockKeyhole className="h-6 w-6 text-navy" aria-hidden /> Secure login
        </h1>
        <p className="mt-1 text-sm text-muted">AICTE and institution users confirm with a one-time password (OTP).</p>

        {dbProblem && (
          <div role="alert" className="mt-4 flex gap-3 rounded border border-[#F0D98A] bg-[#FFF6D9] px-3 py-3 text-sm text-[#5C4400]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{!health.db ? "Database is not reachable" : "Database has no demo data yet"}</p>
              <p className="mt-0.5">
                {!health.db ? (
                  <>Start it with <code className="rounded bg-white px-1">npm run demo</code> (local) or check <code className="rounded bg-white px-1">MONGODB_URI</code>.</>
                ) : (
                  <>Run <code className="rounded bg-white px-1">npm run seed</code> once, then reload this page.</>
                )}
              </p>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded border border-[#F3B9B9] bg-[#FDECEC] px-3 py-2 text-sm text-[#9E1C1C]">
            {error}
          </p>
        )}

        {!challenge ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start(email, password, "form");
            }}
            className="mt-6 space-y-4"
          >
            <Field label="Email" htmlFor="email">
              <Input id="email" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-navy" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy === "form"}>
              Continue
            </Button>
            <p className="text-xs text-muted">Accounts lock for 15 minutes after 5 failed attempts.</p>
          </form>
        ) : (
          <form onSubmit={step2} className="mt-6 space-y-4">
            <p className="text-sm">
              Signing in as <b>{email}</b>
            </p>
            <Field label="One-time password" htmlFor="otp" hint={otpAutofilled ? "Demo mode: the OTP (mock SMS) has been filled in for you." : "Enter the 6-digit OTP sent to your registered mobile."}>
              <Input id="otp" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="text-center text-lg tracking-[0.5em]" />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy === "otp"}>
              <KeyRound className="h-4 w-4" aria-hidden /> Verify & sign in
            </Button>
            <button
              type="button"
              className="text-sm text-navy hover:underline"
              onClick={() => {
                setChallenge(null);
                setOtp("");
                setError(null);
              }}
            >
              Use a different account
            </button>
          </form>
        )}
      </Card>

      <Card className="p-5">
        <p className="font-semibold">One-click demo login</p>
        <p className="mt-1 text-xs text-muted">
          All demo accounts use password <code className="rounded bg-page px-1 font-semibold text-ink">{DEMO_PASSWORD}</code>. Click a role to sign in.
        </p>
        <ul className="mt-3 grid gap-2">
          {DEMO.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => quickLogin(d.email)}
                className="flex w-full items-center gap-3 rounded border border-line px-3 py-2.5 text-left hover:border-navy hover:bg-navy-tint disabled:opacity-60"
              >
                <d.icon className="h-5 w-5 shrink-0 text-navy" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy">{busy === d.email ? "Signing in…" : d.label}</span>
                  <span className="block truncate text-xs text-muted">
                    {d.email} · {d.hint}
                  </span>
                </span>
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

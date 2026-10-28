"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Landmark,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = {
  AICTE_ADMIN: "/aicte",
  INSTITUTION: "/institution",
  STUDENT: "/student",
};

const SHOW_DEMO = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_PASSWORD = "Demo@123";
const DEMO_ACCOUNTS = [
  { email: "admin@aicte.demo", label: "AICTE HQ Admin", desc: "Full national access", icon: Landmark, tone: "bg-[#E6F0FE] text-vv-blue" },
  { email: "regional@aicte.demo", label: "Regional Officer", desc: "Western region view", icon: UserCog, tone: "bg-[#E6F0FE] text-vv-blue" },
  { email: "regulator@aicte.demo", label: "Regulator", desc: "Read-only dashboards", icon: ShieldCheck, tone: "bg-[#EFEAFD] text-[#6D4FD6]" },
  { email: "institute@demo", label: "Institution Admin", desc: "Manage institute records", icon: Building2, tone: "bg-vv-greenbg text-vv-green" },
  { email: "operator@demo", label: "Institution Operator", desc: "Data entry & uploads", icon: Users, tone: "bg-vv-greenbg text-vv-green" },
  { email: "student@demo", label: "Student", desc: "Own record & consent", icon: GraduationCap, tone: "bg-vv-orangebg text-vv-saffron" },
];

const inputCls =
  "h-12 w-full rounded-xl border border-vv-line bg-white pl-11 pr-4 text-[15px] text-vv-text placeholder:text-vv-muted/60 transition focus:border-vv-blue focus:outline-none focus:ring-4 focus:ring-vv-blue/10";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<{ challengeId: string; otpRequired: boolean; devOtp?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("reason") === "idle" ? "You were signed out after 15 minutes of inactivity for security." : null
  );

  const finish = async (challengeId: string, code: string) => {
    const r = await signIn("credentials", { challengeId, otp: code, redirect: false });
    if (r?.error) throw new Error("Incorrect or expired one-time password (OTP)");
    setAuthSuccess(true);
    const s = await getSession();
    const next = params.get("callbackUrl");
    window.location.href =
      next && next.startsWith("/") && !next.startsWith("//") ? next : HOME[s?.user?.role ?? ""] ?? "/";
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ challengeId: string; otpRequired: boolean; devOtp?: string }>("/api/auth/otp", "POST", { email, password });
      if (!r.otpRequired) return await finish(r.challengeId, "");
      setChallenge(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      await finish(challenge.challengeId, otp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  // Redirect if already signed in
  useEffect(() => {
    getSession().then((s) => {
      if (s?.user?.role) window.location.href = HOME[s.user.role] ?? "/";
    });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[radial-gradient(60%_50%_at_50%_0%,#E4EEFD_0%,#F7FAFF_60%,#FFFFFF_100%)] px-4 py-10 lg:min-h-[calc(100vh-80px)]">
      {/* Right: form */}
      <section className="flex w-full justify-center">
        <div className="w-full max-w-[460px]">
          <div className="rounded-3xl border border-vv-line bg-white p-6 shadow-[0_24px_50px_-28px_rgba(16,35,78,0.35)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F0FE] text-vv-blue">
                {challenge ? <KeyRound className="h-5 w-5" aria-hidden /> : <LockKeyhole className="h-5 w-5" aria-hidden />}
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-vv-navy">
                  {challenge ? "Two-factor verification" : "Sign in to your account"}
                </h2>
                <p className="text-[13px] text-vv-muted">
                  {challenge ? "Enter the 6-digit code for your registered mobile." : "Use your institutional or student credentials."}
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            {authSuccess && (
              <div role="status" className="mt-5 flex items-center gap-2.5 rounded-xl border border-vv-green/30 bg-vv-greenbg p-3.5 text-sm font-medium text-vv-green">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Verified. Redirecting to your portal…
              </div>
            )}

            {!challenge ? (
              <form onSubmit={handleStep1} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-vv-muted">
                    Email or institutional ID
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-vv-muted" aria-hidden />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="you@institution.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-vv-muted">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-vv-muted" aria-hidden />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(inputCls, "pr-12")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-vv-ice hover:text-vv-blue"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="xl"
                  className="group h-12 w-full rounded-xl !bg-vv-blue shadow-[0_12px_24px_-12px_rgba(6,72,181,0.7)] hover:!bg-[#053a96]"
                  loading={busy}
                  disabled={authSuccess}
                >
                  Continue to verification
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Button>
                <p className="text-center text-[12px] text-vv-muted">Accounts lock for 15 minutes after 5 consecutive failed attempts.</p>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="mt-6 space-y-4">
                {challenge.devOtp && (
                  <div className="rounded-xl border border-vv-saffron/40 bg-vv-orangebg p-3 text-sm text-[#9A5A00]">
                    Demo one-time code: <b className="font-mono text-base tracking-widest">{challenge.devOtp}</b>
                  </div>
                )}
                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-vv-muted">
                    One-time password
                  </label>
                  <input
                    id="otp"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="h-14 w-full rounded-xl border border-vv-line bg-white text-center font-mono text-2xl tracking-[0.5em] text-vv-navy focus:border-vv-blue focus:outline-none focus:ring-4 focus:ring-vv-blue/10"
                  />
                </div>
                <Button
                  type="submit"
                  size="xl"
                  className="h-12 w-full rounded-xl !bg-vv-blue hover:!bg-[#053a96]"
                  loading={busy}
                  disabled={authSuccess}
                >
                  <KeyRound className="h-4 w-4" aria-hidden />
                  Verify &amp; access portal
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-sm font-semibold text-vv-blue hover:underline"
                  onClick={() => {
                    setChallenge(null);
                    setOtp("");
                    setError(null);
                  }}
                >
                  ← Use a different account
                </button>
              </form>
            )}

            {SHOW_DEMO && !challenge && (
              <div className="mt-7 border-t border-vv-line pt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-vv-muted">
                  Demo accounts · click to fill (password {DEMO_PASSWORD})
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map(({ email: e, label, desc, icon: Icon, tone }) => (
                    <li key={e}>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(e);
                          setPassword(DEMO_PASSWORD);
                          setError(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors hover:border-vv-blue/50 hover:bg-vv-ice",
                          email === e ? "border-vv-blue bg-vv-ice" : "border-vv-line"
                        )}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate text-[12.5px] font-semibold text-vv-navy">{label}</span>
                          <span className="block truncate text-[11px] text-vv-muted">{desc}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="mt-5 text-center text-[12px] leading-relaxed text-vv-muted">
            Access is restricted to authorised institutional personnel, AICTE officials and enrolled students. Unauthorised access attempts are logged.
          </p>
        </div>
      </section>
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

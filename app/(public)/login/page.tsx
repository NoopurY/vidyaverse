"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { VidyaVerseBrand, VidyaVerseLogo } from "@/components/brand";
import { api } from "@/lib/fetcher";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = {
  AICTE_ADMIN: "/aicte",
  INSTITUTION: "/institution",
  STUDENT: "/student",
};

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    otpRequired: boolean;
    devOtp?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("reason") === "idle"
      ? "You were signed out after 15 minutes of inactivity for security."
      : null
  );

  const finish = async (challengeId: string, code: string) => {
    const r = await signIn("credentials", {
      challengeId,
      otp: code,
      redirect: false,
    });
    if (r?.error) throw new Error("Incorrect or expired one-time password (OTP)");
    setAuthSuccess(true);
    const s = await getSession();
    const next = params.get("callbackUrl");
    window.location.href =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : HOME[s?.user?.role ?? ""] ?? "/";
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{
        challengeId: string;
        otpRequired: boolean;
        devOtp?: string;
      }>("/api/auth/otp", "POST", { email, password });
      if (!r.otpRequired) {
        return await finish(r.challengeId, "");
      }
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
      if (s?.user?.role) {
        window.location.href = HOME[s.user.role] ?? "/";
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Brand & trust principles ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col bg-navy-deep text-white relative overflow-hidden">
        {/* Subtle geometric decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-navy/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-navy/20 blur-3xl" />
          <div
            className="absolute top-1/3 right-8 w-px h-48 opacity-20"
            style={{ background: "linear-gradient(to bottom, transparent, #FF9933, transparent)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <VidyaVerseLogo size={40} />
            <div>
              <span className="text-lg font-bold tracking-tight text-white">VidyaVerse</span>
              <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest leading-none mt-0.5">
                APAAR Platform
              </p>
            </div>
          </div>

          {/* Main tagline */}
          <div className="mt-auto mb-auto pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-saffron mb-4">
              Secure Institutional Access
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-white">
              One trusted identity
              <br />
              for every student.
            </h1>
            <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-xs">
              Manage academic records, control credential consent, and enable
              authorised verifications through a secure, auditable ecosystem.
            </p>
          </div>

          {/* Trust principles */}
          <div className="space-y-4 pb-4">
            {[
              {
                icon: ShieldCheck,
                title: "Consent-based access",
                desc: "Students control who sees their records",
              },
              {
                icon: UserCheck,
                title: "Institution-verified records",
                desc: "Every credential is anchored to approved intake",
              },
              {
                icon: LockKeyhole,
                title: "Cryptographic audit trail",
                desc: "Every access event is logged and tamper-evident",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-saffron" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/90">{title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-white/30 pt-6 border-t border-white/10">
            © {new Date().getFullYear()} VidyaVerse · AICTE · Government of India
          </p>
        </div>
      </div>

      {/* ── Right panel: Login form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-page px-5 py-10 sm:px-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <VidyaVerseLogo size={32} />
          <VidyaVerseBrand />
        </div>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card border border-line p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink">
                {challenge ? "Two-Factor Verification" : "Sign in to your account"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {challenge
                  ? "Enter the 6-digit code sent to your registered mobile number."
                  : "Enter your institutional credentials to continue."}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {authSuccess && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-light p-3.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Verified — redirecting to your portal…</span>
              </div>
            )}

            {/* Step 1: Email + Password */}
            {!challenge ? (
              <form onSubmit={handleStep1} className="space-y-4">
                <Field label="Institutional Email Address" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="you@institution.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field label="Password" htmlFor="password">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Button
                  type="submit"
                  size="xl"
                  className="w-full mt-2"
                  loading={busy}
                  disabled={authSuccess}
                >
                  <span>Continue to Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-[11px] text-muted text-center">
                  Accounts lock for 15 minutes after 5 consecutive failed attempts.
                </p>
              </form>
            ) : (
              /* Step 2: OTP */
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="rounded-xl border border-navy/20 bg-navy-light/40 p-4">
                  <p className="text-xs font-semibold text-navy">
                    Two-Factor Authentication Required
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    A 6-digit confirmation code was sent to your registered mobile device.
                  </p>
                  {challenge.devOtp && (
                    <div className="mt-2.5 rounded-lg border border-saffron/40 bg-saffron-light p-2 text-xs text-[#9A6200] font-mono">
                      Dev OTP:{" "}
                      <b>{challenge.devOtp}</b>
                    </div>
                  )}
                </div>

                <Field label="One-Time Password (OTP)" htmlFor="otp">
                  <Input
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
                    className="text-center font-mono text-xl tracking-[0.4em] h-12"
                  />
                </Field>

                <Button
                  type="submit"
                  size="xl"
                  className="w-full"
                  loading={busy}
                  disabled={authSuccess}
                >
                  <KeyRound className="h-4 w-4" />
                  Verify &amp; Access Portal
                </Button>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    className="text-xs font-semibold text-navy hover:underline"
                    onClick={() => {
                      setChallenge(null);
                      setOtp("");
                      setError(null);
                    }}
                  >
                    ← Sign in with a different account
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] text-muted">
            Access is restricted to authorised institutional personnel, AICTE officials, and enrolled students.
            <br />
            Unauthorised access attempts are logged.
          </p>
        </div>
      </div>
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

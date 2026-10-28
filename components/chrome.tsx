"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CheckCircle2, Globe, LogOut, ShieldCheck, User } from "lucide-react";
import { useT } from "./providers";
import { LANGS, type Lang } from "@/lib/i18n";
import { VidyaVerseBrand } from "./brand";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export function TricolourStrip() {
  return (
    <div className="flex h-1 w-full" aria-hidden>
      <div className="flex-1 bg-saffron" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-indgreen" />
    </div>
  );
}

function setFs(v: "sm" | "md" | "lg") {
  if (v === "md") delete document.documentElement.dataset.fs;
  else document.documentElement.dataset.fs = v;
  try {
    localStorage.setItem("fs", v === "md" ? "" : v);
  } catch {}
}

export function UtilityBar() {
  const { t, lang, setLang } = useT();
  return (
    <div className="border-b border-line bg-[#F8FAFD] text-xs text-muted">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
        <div className="flex items-center gap-3">
          <a
            href="#main"
            className="font-medium text-navy transition-colors hover:text-[#082B63] hover:underline underline-offset-2"
          >
            {t("skip")}
          </a>
          <span className="hidden sm:inline-block text-line">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden /> Official Academic Identity & Verification Platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Text size selector */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Text size adjustments">
            <span className="mr-1 text-[11px] text-muted hidden sm:inline">Text Size:</span>
            <button
              onClick={() => setFs("sm")}
              className="rounded px-1.5 py-0.5 hover:bg-white hover:text-navy transition-colors"
              aria-label="Decrease text size"
            >
              A-
            </button>
            <button
              onClick={() => setFs("md")}
              className="rounded px-1.5 py-0.5 font-medium hover:bg-white hover:text-navy transition-colors"
              aria-label="Default text size"
            >
              A
            </button>
            <button
              onClick={() => setFs("lg")}
              className="rounded px-1.5 py-0.5 hover:bg-white hover:text-navy transition-colors"
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>
          <span className="h-3 w-px bg-line" aria-hidden />
          {/* Language selector */}
          <div className="flex items-center gap-1" role="group" aria-label="Language selection">
            <Globe className="h-3.5 w-3.5 text-muted hidden sm:inline" aria-hidden />
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                lang={l}
                aria-pressed={lang === l}
                className={cn(
                  "rounded px-2 py-0.5 transition-colors font-medium text-xs",
                  lang === l
                    ? "bg-navy text-white shadow-xs"
                    : "text-muted hover:bg-white hover:text-navy"
                )}
              >
                {LANGS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  "AICTE_ADMIN:full": "AICTE HQ",
  "AICTE_ADMIN:regional": "Regional Officer",
  "AICTE_ADMIN:readonly": "Regulator",
  "INSTITUTION:admin": "Institution Admin",
  "INSTITUTION:operator": "Operator",
  "STUDENT:self": "Student",
};

const ROLE_HOME: Record<string, string> = {
  AICTE_ADMIN: "/aicte",
  INSTITUTION: "/institution",
  STUDENT: "/student",
};

export function SiteHeader() {
  const { t } = useT();
  const path = usePathname();
  const { data } = useSession();
  const u = data?.user;

  const navItems: [string, string][] = [
    ["/", t("home")],
    ["/verify", t("verify")],
    ["/about", t("about")],
    ["/help", t("help")],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Brand Identity */}
        <Link href="/" className="transition-opacity hover:opacity-95" aria-label="VidyaVerse Homepage">
          <VidyaVerseBrand />
        </Link>

        {/* Center / Right: Clean public navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary Navigation">
          {navItems.map(([href, label]) => {
            const isActive = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-navy font-semibold bg-navy-light/70"
                    : "text-ink hover:text-navy hover:bg-[#F0F4FA]"
                )}
              >
                {label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-saffron"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side authentication or user profile */}
        <div className="flex items-center gap-2.5">
          {u ? (
            <div className="flex items-center gap-3">
              <Link
                href={ROLE_HOME[u.role] ?? "/"}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-[#F8FAFD] p-1.5 pr-3 hover:bg-navy-light/60 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  {u.name?.[0] ?? <User className="h-4 w-4" />}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-semibold text-ink line-clamp-1">{u.name}</p>
                  <p className="text-[10.5px] text-muted">
                    {ROLE_LABEL[`${u.role}:${u.permission}`] ?? u.role}
                  </p>
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label={t("logout")}
                className="hidden sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only sm:not-sr-only text-xs">{t("logout")}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="md">
                <Link href="/verify">{t("verify")}</Link>
              </Button>
              <Button asChild size="md">
                <Link href="/login">{t("login")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Legacy public nav retained as no-op or fallback for layout structure */
export function PublicNav() {
  return null;
}

export function Footer() {
  const { t } = useT();

  const legalLinks: [string, string][] = [
    ["/about", t("about")],
    ["/help", t("help")],
    ["/privacy", t("privacy")],
    ["/terms", t("terms")],
    ["/accessibility", t("accessibility")],
    ["/contact", t("contact")],
    ["/api-docs", "API Docs (OpenAPI)"],
  ];

  return (
    <footer className="mt-auto bg-[#082B63] text-white">
      {/* Top CTA Banner */}
      <div className="border-b border-white/10 bg-[#0B3D91]/60 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-saffron/20 border border-saffron/30 px-3 py-1 text-xs font-semibold text-saffron">
              <CheckCircle2 className="h-3.5 w-3.5" /> Trusted Academic Verification
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Build a more verifiable academic ecosystem.
            </h2>
            <p className="mt-1 text-sm text-white/80 max-w-xl">
              Connect institutional admissions with W3C verifiable credentials and student-governed consent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-navy hover:bg-[#F0F4FA] font-semibold">
              <Link href="/login">{t("accessPortal")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/verify">{t("verify")}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <VidyaVerseBrand inverted />
            <p className="mt-3 text-xs leading-relaxed text-white/75 max-w-md">
              A unified academic identity and verification ecosystem that enables AICTE-approved institutions
              to maintain accountable student records, allows students to control access to their credentials,
              and empowers authorized verifiers with instant, cryptographic proof.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-white/60">
              <span>● W3C Verifiable Credentials 2.0</span>
              <span>● SD-JWT Selective Disclosure</span>
              <span>● DPDP Act 2023 Compliant</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-saffron mb-3">Platform Portals</p>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <Link href="/institution" className="hover:text-white hover:underline transition-colors">
                  Institution Management Portal
                </Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-white hover:underline transition-colors">
                  Student Identity & Consent Portal
                </Link>
              </li>
              <li>
                <Link href="/aicte" className="hover:text-white hover:underline transition-colors">
                  AICTE Monitoring & Intelligence
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white hover:underline transition-colors">
                  Public Credential Verification
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-saffron mb-3">Governance & Support</p>
            <ul className="space-y-2 text-xs text-white/80">
              {legalLinks.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white hover:underline transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60">
          <p>{t("contentOwned")} · All India Council for Technical Education (AICTE)</p>
          <p>
            {t("lastUpdated")}: {process.env.NEXT_PUBLIC_LAST_UPDATED ?? "28 Oct 2026"} · Version 1.0
          </p>
        </div>
      </div>
    </footer>
  );
}

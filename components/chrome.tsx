"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useT } from "./providers";
import { VidyaVerseBrand } from "./brand";
import { Button } from "./ui";

export function TricolourStrip() {
  return (
    <div className="flex h-1 w-full" aria-hidden>
      <div className="flex-1 bg-saffron" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-indgreen" />
    </div>
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

"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Layers,
  Lock,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useT } from "@/components/providers";
import { Button, Card, CardBody } from "@/components/ui";
import { IdentityEcosystemIllustration } from "@/components/brand";

export default function Home() {
  const { t } = useT();

  const trustPillars = [
    {
      icon: Fingerprint,
      title: "Identity Integrity",
      description:
        "APAAR-keyed student records validated directly against official registries, preventing ghost profiles, mismatched credentials, and multiple fraudulent enrolments.",
    },
    {
      icon: KeyRound,
      title: "Consent & Privacy",
      description:
        "Built under the DPDP Act 2023. Students possess sovereign control over their records, approving who accesses their data, for what stated purpose, and until what expiry date.",
    },
    {
      icon: Layers,
      title: "Intake Accountability",
      description:
        "A cryptographically enforced digital seat ledger prevents institutions from enrolling beyond approved intake quotas. Every student admission consumes exactly one valid seat token.",
    },
    {
      icon: Clock,
      title: "Auditability",
      description:
        "Every data submission, verification event, and consent approval is permanently inscribed into a SHA-256 hash-chained audit log, providing instant dispute resolution.",
    },
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Institution Submits Data",
      description:
        "Institutions upload batch student records using standardized schemas. Immediate browser checks highlight formatting and registry discrepancies.",
      icon: Building2,
    },
    {
      step: 2,
      title: "Identity & Consent Verified",
      description:
        "APAAR IDs are validated against official databases. Student notification channels and consent preferences are verified.",
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: "Digital Seat Ledger Check",
      description:
        "Admissions are validated against the institution's approved seat ledger. Any over-intake attempt is automatically blocked at the source.",
      icon: Database,
    },
    {
      step: 4,
      title: "Verifiable Credential Ready",
      description:
        "Tamper-proof W3C Verifiable Credentials with Ed25519 digital signatures and selective disclosure (SD-JWT) are ready for authorized verification.",
      icon: QrCode,
    },
  ];

  const audienceCards = [
    {
      icon: Building2,
      title: "Manage student records",
      audience: "For Institutions",
      description:
        "Submit academic records, validate student information, monitor intake, and track data quality with real-time seat ledger verification.",
      href: "/login?role=INSTITUTION",
      cta: "Institution Portal",
    },
    {
      icon: GraduationCap,
      title: "Own your academic identity",
      audience: "For Students",
      description:
        "Review your academic record, manage consent, and access your verifiable credentials with complete control over your private information.",
      href: "/login?role=STUDENT",
      cta: "Student Portal",
    },
    {
      icon: ShieldCheck,
      title: "Verify with confidence",
      audience: "For Verifiers & Employers",
      description:
        "Check credential authenticity and confirm record validity through authorized verification workflows with instant cryptographic certainty.",
      href: "/verify",
      cta: "Verify a Student",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F8FC]">
      {/* ============================================================ */}
      {/* SECTION A: HERO */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-line bg-white py-12 md:py-20">
        {/* Subtle background ambient grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#0B3D91_1px,transparent_1px),linear-gradient(to_bottom,#0B3D91_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-navy/15 bg-navy-light px-3.5 py-1 text-xs font-semibold text-navy">
                <span className="h-2 w-2 rounded-full bg-saffron" aria-hidden />
                <span>APAAR-LINKED · CONSENT-BASED · VERIFIABLE CREDENTIALS</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                Every seat accountable.{" "}
                <span className="block text-navy mt-1">
                  Every student <span className="underline decoration-saffron decoration-4 underline-offset-6">verifiable.</span>
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted md:text-lg leading-relaxed">
                Bring student records, approved institutional intake, and academic identity verification
                into one secure, auditable ecosystem built on W3C Verifiable Credentials and the DPDP Act 2023.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Button asChild size="xl" className="shadow-md">
                  <Link href="/login">
                    {t("accessPortal")} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="secondary">
                  <Link href="/verify">{t("verify")}</Link>
                </Button>
              </div>

              {/* Three compact trust indicators */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-line/80">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-ink">Institution-verified</p>
                    <p className="text-[11px] text-muted">Validated intake data</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-ink">Student-controlled</p>
                    <p className="text-[11px] text-muted">Consent-driven sharing</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-ink">Auditable trail</p>
                    <p className="text-[11px] text-muted">Cryptographic ledger</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Custom Identity Visualization */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full rounded-2xl border border-line bg-[#F8FAFD] p-4 sm:p-6 shadow-sm">
                <IdentityEcosystemIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION B: PLATFORM CAPABILITIES STRIP */}
      {/* ============================================================ */}
      <section className="border-b border-line bg-[#082B63] text-white py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="p-2">
              <p className="text-xs uppercase tracking-wider text-saffron font-bold">Standardized Intake</p>
              <p className="mt-1 text-sm font-semibold text-white">Institution-led submissions</p>
              <p className="text-xs text-white/70">Structured validation schemas</p>
            </div>
            <div className="p-2">
              <p className="text-xs uppercase tracking-wider text-saffron font-bold">Intake Protection</p>
              <p className="mt-1 text-sm font-semibold text-white">Digital seat ledger</p>
              <p className="text-xs text-white/70">Zero unapproved enrolments</p>
            </div>
            <div className="p-2">
              <p className="text-xs uppercase tracking-wider text-saffron font-bold">Privacy Architecture</p>
              <p className="mt-1 text-sm font-semibold text-white">Consent-based access</p>
              <p className="text-xs text-white/70">Selective field disclosure</p>
            </div>
            <div className="p-2">
              <p className="text-xs uppercase tracking-wider text-saffron font-bold">Integrity Trail</p>
              <p className="mt-1 text-sm font-semibold text-white">Auditable activity</p>
              <p className="text-xs text-white/70">SHA-256 tamper-proof log</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION C: THREE AUDIENCE CARDS */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-saffron">Targeted Stakeholder Portals</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">
              One unified platform serving three core constituents
            </p>
            <p className="mt-2 text-sm text-muted">
              Designed to satisfy the specialized compliance, privacy, and verification needs of every stakeholder.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {audienceCards.map((c) => {
              const Icon = c.icon;
              return (
                <Card
                  key={c.title}
                  className="flex flex-col justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:border-navy/40 hover:shadow-elevated"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-light text-navy border border-navy/15">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-saffron">
                      {c.audience}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-ink">{c.title}</h3>
                    <p className="mt-2 text-xs md:text-sm text-muted leading-relaxed">{c.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-line/80">
                    <Button asChild variant="secondary" className="w-full justify-between">
                      <Link href={c.href}>
                        <span>{c.cta}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION D: HOW VIDYAVERSE WORKS */}
      {/* ============================================================ */}
      <section className="border-y border-line bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron">Verification Pipeline</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">
              How VidyaVerse protects academic integrity
            </h2>
            <p className="mt-2 text-sm text-muted">
              From approved institutional data submission to cryptographically guaranteed third-party verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Horizontal line for desktop */}
            <div className="hidden md:block absolute top-7 left-12 right-12 h-0.5 bg-line z-0" aria-hidden />

            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-navy text-navy shadow-sm mb-4">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="rounded-full bg-saffron-light px-2.5 py-0.5 text-[11px] font-bold text-[#B45309]">
                    Step 0{step.step}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION E: PLATFORM GUARANTEES */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron">Architectural Pillars</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Guarantees of the VidyaVerse Platform
            </h2>
            <p className="mt-2 text-sm text-muted">
              Built to the highest digital public infrastructure benchmarks for trust, scale, and compliance.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPillars.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white mb-4">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-base font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{p.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

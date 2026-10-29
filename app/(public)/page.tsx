"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ChevronRight, GraduationCap, ShieldCheck } from "lucide-react";
import { useT } from "@/components/providers";
import { Button, Card } from "@/components/ui";

const PIPELINE = ["Institution", "Student Data Upload", "APAAR Validation", "Data Verification", "AICTE Central Repository", "Analytics & Monitoring", "Authorised Verification"];

export default function Home() {
  const { t } = useT();
  const cards = [
    { icon: Building2, title: t("forInstitutions"), body: t("forInstitutionsBody"), href: "/login", cta: t("login") },
    { icon: GraduationCap, title: t("forStudents"), body: t("forStudentsBody"), href: "/login", cta: t("login") },
    { icon: BadgeCheck, title: t("verify"), body: t("verifyCardBody"), href: "/verify", cta: t("verify") },
  ];
  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr] md:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-navy-tint px-3 py-1 text-xs font-semibold text-navy">
              <ShieldCheck className="h-4 w-4" aria-hidden /> APAAR-linked · Consent-based · W3C Verifiable Credentials
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{t("heroTitle")}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted">{t("heroBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  {t("login")} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/verify">{t("verify")}</Link>
              </Button>
            </div>
          </div>
          <Card className="self-center p-6">
            <p className="text-sm font-semibold text-navy">What the portal guarantees</p>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                ["Seat Ledger", "No admission beyond approved intake – each seat is a token consumed once."],
                ["Fraud intelligence", "Counselling, scholarship and contact cross-checks with a transparent risk score."],
                ["Privacy by design", "Tokenised APAAR, encrypted contacts, student-controlled consent (DPDP Act 2023)."],
                ["Tamper-proof trail", "Every access and change written to a SHA-256 hash-chained audit log."],
              ].map(([h, b]) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-saffron" aria-hidden />
                  <span>
                    <span className="font-semibold">{h}.</span> <span className="text-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.title} className="flex flex-col p-6">
              <c.icon className="h-8 w-8 text-navy" aria-hidden />
              <h2 className="card-title mt-4">{c.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{c.body}</p>
              <Link href={c.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
                {c.cta} <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </Card>
          ))}
        </div>

        <h2 className="card-title mt-12">{t("howItWorks")}</h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {PIPELINE.map((step, i) => (
            <li key={step} className="relative rounded border border-line bg-white px-3 py-3 text-sm">
              <span className="mb-1 block text-xs font-semibold text-saffron">Step {i + 1}</span>
              <span className="font-medium">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

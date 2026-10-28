import Link from "next/link";
import { ArrowRight, FileCheck2, Landmark, QrCode, ShieldCheck, UserCheck, UserRound } from "lucide-react";
import { AcademicIdentityCard } from "./identity-card";
import { EcosystemConnections } from "./ecosystem";
import { IndiaBackdrop } from "./india-backdrop";
import { ScaledStage } from "./scaled-stage";
import { StudentIllustration } from "./student-illustration";

function TrustBadge() {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-[#E6F0FE] px-3.5 py-2 text-[12px] font-medium text-vv-text sm:px-4 sm:text-[13px]">
      <ShieldCheck className="h-4 w-4 shrink-0 text-vv-blue" aria-hidden />
      <span>
        APAAR-linked <span aria-hidden>·</span> Consent-based <span aria-hidden>·</span> Verifiable credentials
      </span>
    </div>
  );
}

function HeroActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/login"
        className="group inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-vv-blue px-8 text-base font-semibold text-white shadow-[0_12px_24px_-10px_rgba(6,72,181,0.65)] transition-all hover:bg-[#053a96]"
      >
        Access Portal
        <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
      <Link
        href="/verify"
        className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-vv-blue bg-white px-8 text-base font-semibold text-vv-blue transition-colors hover:bg-vv-ice"
      >
        <QrCode className="h-[18px] w-[18px]" aria-hidden />
        Verify a Student
      </Link>
    </div>
  );
}

function TrustIndicators() {
  const items = [
    { icon: ShieldCheck, title: "Institution-verified", sub: "Records", tone: "bg-vv-greenbg text-vv-green" },
    { icon: UserCheck, title: "Student-controlled", sub: "Consent", tone: "bg-[#E6F0FE] text-vv-blue" },
    { icon: FileCheck2, title: "Auditable", sub: "Verification history", tone: "bg-vv-orangebg text-vv-saffron" },
  ];
  return (
    <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
      {items.map(({ icon: Icon, title, sub, tone }) => (
        <li key={title} className="flex items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[13px] leading-snug text-vv-muted">
            {title}
            <br />
            {sub}
          </span>
        </li>
      ))}
    </ul>
  );
}

const FLOATS = {
  institutions: { icon: Landmark, title: "Institutions", text: "Submit & validate student data", tone: "text-vv-blue" },
  students: { icon: UserRound, title: "Students", text: "Own and manage their identity", tone: "text-vv-blue2" },
  verifiers: { icon: ShieldCheck, title: "Verifiers", text: "Check authentic academic records", tone: "text-vv-green" },
} as const;

function FloatingCard({ kind, className, badge = "left" }: { kind: keyof typeof FLOATS; className?: string; badge?: "left" | "top" }) {
  const { icon: Icon, title, text, tone } = FLOATS[kind];
  return (
    <div className={`rounded-2xl border border-white bg-white/85 shadow-[0_14px_30px_-14px_rgba(16,35,78,0.3)] backdrop-blur ${className ?? ""}`}>
      {badge === "top" ? (
        <div className="relative px-3.5 pb-3 pt-7">
          <span className="absolute -top-5 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_-8px_rgba(16,35,78,0.35)]">
            <Icon className={`h-6 w-6 ${tone}`} aria-hidden />
          </span>
          <p className="text-center text-[13px] font-bold text-vv-navy">{title}</p>
          <p className="mt-0.5 text-center text-[11px] leading-snug text-vv-muted">{text}</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vv-ice">
            <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
          </span>
          <div>
            <p className="text-[13px] font-bold text-vv-navy">{title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-vv-muted">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroVisual() {
  return (
    <>
      {/* tablet / desktop: layered composition on a scaled design canvas */}
      <ScaledStage w={680} h={520} className="mx-auto hidden w-full max-w-[680px] md:block">
        <div className="absolute left-[60px] top-[20px] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,#DCEAFE_0%,rgba(220,234,254,0)_68%)]" aria-hidden />
        <IndiaBackdrop className="absolute left-[130px] top-[10px] h-[480px] w-[420px] opacity-60" />
        <EcosystemConnections className="absolute inset-0 h-full w-full" />

        <StudentIllustration className="absolute bottom-0 left-[20px] z-20 h-[390px] w-[253px]" />

        <div className="absolute left-[238px] top-[96px] z-10 w-[318px] [transform:perspective(1200px)_rotateY(-9deg)_rotateZ(-6deg)]">
          <div className="vv-float-slow">
            <AcademicIdentityCard />
          </div>
        </div>

        <FloatingCard kind="institutions" badge="top" className="vv-float absolute left-[214px] top-[8px] z-30 w-[150px]" />
        <FloatingCard kind="students" badge="top" className="vv-float-slow absolute left-[520px] top-[34px] z-30 w-[158px]" />
        <FloatingCard kind="verifiers" badge="top" className="vv-float absolute left-[530px] top-[392px] z-30 w-[148px]" />

        <p className="absolute left-[572px] top-[200px] z-10 hidden w-[108px] -rotate-[8deg] font-hand text-[19px] leading-[1.05] text-vv-text/80 min-[1400px]:block">
          A more transparent education ecosystem for a stronger India.
          <span className="mt-1.5 flex gap-1" aria-hidden>
            <span className="h-[3px] w-12 rounded-full bg-vv-saffron" />
            <span className="h-[3px] w-12 rounded-full bg-vv-green" />
          </span>
        </p>
      </ScaledStage>

      {/* mobile: simplified composition */}
      <div className="mx-auto max-w-[360px] md:hidden">
        <div className="relative">
          <div className="absolute inset-x-0 -top-6 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle,#DCEAFE_0%,rgba(220,234,254,0)_70%)]" aria-hidden />
          <AcademicIdentityCard className="relative -rotate-3" />
        </div>
        <ul className="mt-6 grid gap-2.5">
          {(Object.keys(FLOATS) as (keyof typeof FLOATS)[]).map((k) => (
            <li key={k}>
              <FloatingCard kind={k} className="!bg-white" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F7FF_100%)]">
      <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#E4EEFD_0%,rgba(228,238,253,0)_70%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-10 sm:px-6 md:py-14 xl:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] xl:gap-6 lg:px-8 lg:py-16">
        <div className="vv-rise">
          <TrustBadge />
          <h1 className="mt-6 text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] text-vv-navy sm:text-[46px] lg:text-[50px] xl:text-[44px] min-[1400px]:text-[50px] 2xl:text-[54px]">
            <span className="block">Every seat accountable.</span>
            <span className="block">
              <span className="text-vv-blue">Every student</span>{" "}
              <span className="relative inline-block text-vv-saffron">
                verifiable.
                <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full" aria-hidden focusable="false">
                  <path d="M3 9 C 40 2, 90 12, 130 6 S 185 5, 197 8" fill="none" stroke="#FF8A18" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-[1.55] text-vv-muted md:text-[18px]">
            A unified academic identity platform connecting institutions, students and authorized verifiers through secure,
            consent-driven and verifiable academic records.
          </p>
          <HeroActions />
          <TrustIndicators />
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

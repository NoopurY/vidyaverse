import Link from "next/link";
import { ArrowRight, FileCheck2, GraduationCap, History, Landmark, ShieldCheck, UserCheck, Users } from "lucide-react";

/* The reference design shows headline numbers; those are unverified here, so the strip
   states the platform's properties instead of publishing statistics. */
export function StatisticsStrip() {
  const items = [
    { icon: Landmark, label: "Institutional Data", value: "Validated intake", tone: "bg-white text-vv-blue" },
    { icon: Users, label: "Student Identity", value: "APAAR-linked", tone: "bg-white text-vv-green" },
    { icon: ShieldCheck, label: "Secure Verification", value: "Consent-based", tone: "bg-white text-vv-saffron" },
    { icon: History, label: "Auditable Records", value: "Tamper-evident", tone: "bg-white text-[#6D4FD6]" },
  ];
  return (
    <section aria-label="Platform principles" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-2 gap-y-6 rounded-[28px] bg-[#EAF3FF] px-4 py-6 sm:px-8 lg:grid-cols-4 lg:gap-y-0 lg:py-7">
        {items.map(({ icon: Icon, label, value, tone }, i) => (
          <li key={label} className={`flex items-center gap-3 sm:gap-4 lg:px-6 ${i > 0 ? "lg:border-l lg:border-[#D3E2F6]" : ""}`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm sm:h-14 sm:w-14 ${tone}`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-vv-muted sm:text-[13px]">{label}</span>
              <span className="block text-[17px] font-extrabold leading-tight text-vv-navy sm:text-[20px]">{value}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BuildingArt({ glass = false }: { glass?: boolean }) {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden focusable="false">
      <ellipse cx="100" cy="138" rx="96" ry="9" fill="#000" opacity="0.05" />
      {glass ? (
        <>
          <path d="M70 138 V30 L140 14 V138 Z" fill="#9CC0F0" />
          <path d="M140 14 L186 30 V138 H140 Z" fill="#6E9EE0" />
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M70 ${44 + i * 13} L140 ${34 + i * 13} L186 ${48 + i * 13}`} stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />
          ))}
          <path d="M105 14 V138" stroke="#fff" strokeOpacity="0.5" />
          <path d="M163 30 V138" stroke="#fff" strokeOpacity="0.5" />
          <circle cx="168" cy="26" r="11" fill="#169447" />
          <path d="M163 26 l3.6 3.8 l7 -7.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <rect x="52" y="52" width="130" height="86" fill="#F3F7FE" stroke="#C6D6EE" />
          <path d="M44 52 L117 20 L190 52 Z" fill="#A9C4EC" />
          {[70, 96, 122, 148].map((x) => (
            <rect key={x} x={x} y="66" width="14" height="44" rx="2" fill="#D3E1F7" />
          ))}
          <rect x="104" y="104" width="26" height="34" rx="2" fill="#6E9EE0" />
          <rect x="40" y="46" width="12" height="92" fill="#DDE8F8" />
        </>
      )}
      <g>
        <rect x="14" y="108" width="6" height="30" fill="#7A5A3B" />
        <circle cx="17" cy="100" r="16" fill="#58B36F" />
        <circle cx="26" cy="108" r="10" fill="#3F9D58" />
      </g>
    </svg>
  );
}

function StudentArt() {
  return (
    <svg viewBox="0 0 160 190" className="h-full w-full" aria-hidden focusable="false">
      <path d="M12 150 C 0 90 36 40 96 28" fill="none" stroke="#FF8A18" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      <path d="M40 190 L44 112 Q50 92 80 90 Q110 92 116 112 L120 190 Z" fill="#2166D1" />
      <path d="M68 92 L80 116 L92 92 Z" fill="#fff" />
      <rect x="71" y="72" width="18" height="22" rx="7" fill="#D49A74" />
      <ellipse cx="80" cy="56" rx="23" ry="26" fill="#E8B48A" />
      <path d="M57 54 Q56 28 82 28 Q106 29 103 54 Q99 40 82 38 Q64 38 57 54 Z" fill="#3B2A24" />
      <circle cx="72" cy="58" r="2.6" fill="#1A1B33" />
      <circle cx="90" cy="58" r="2.6" fill="#1A1B33" />
      <path d="M72 70 Q81 77 91 70" fill="none" stroke="#9B5B3C" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="40" y="130" width="54" height="40" rx="5" fill="#FF8A18" />
      <rect x="46" y="136" width="42" height="28" rx="3" fill="#FFF6EC" />
      <ellipse cx="46" cy="156" rx="9" ry="8" fill="#E8B48A" />
    </svg>
  );
}

export function RoleCards() {
  const cards = [
    {
      key: "institutions",
      icon: Landmark,
      title: "For Institutions",
      text: "Upload student data with an Excel template, get instant error highlighting and fix hints, and track intake and compliance.",
      cta: "Institution Portal",
      href: "/login?role=INSTITUTION",
      theme: "bg-[linear-gradient(135deg,#EAF3FF_0%,#F6FAFF_100%)] border-[#D3E2F6]",
      icon_tone: "bg-white text-vv-blue",
      link: "text-vv-blue",
      art: <BuildingArt />,
    },
    {
      key: "students",
      icon: GraduationCap,
      title: "For Students",
      text: "See your verified record, download a signed certificate of record, and control who can verify you.",
      cta: "Student Portal",
      href: "/login?role=STUDENT",
      theme: "bg-[linear-gradient(135deg,#FFF3E4_0%,#FFFAF3_100%)] border-[#F8DDBB]",
      icon_tone: "bg-white text-vv-saffron",
      link: "text-vv-blue",
      art: <StudentArt />,
    },
    {
      key: "verifiers",
      icon: ShieldCheck,
      title: "For Verifiers",
      text: "Employers and institutions can verify a record with the student's consent code or by scanning the QR.",
      cta: "Verify a Student",
      href: "/verify",
      theme: "bg-[linear-gradient(135deg,#E9F8EF_0%,#F5FCF8_100%)] border-[#C9EBD6]",
      icon_tone: "bg-white text-vv-green",
      link: "text-vv-blue",
      art: <BuildingArt glass />,
    },
  ];
  return (
    <section aria-label="Choose your portal" className="mx-auto mt-8 max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ key, icon: Icon, title, text, cta, href, theme, icon_tone, link, art }) => (
          <li key={key}>
            <article
              className={`group relative flex h-full min-h-[200px] overflow-hidden rounded-3xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(16,35,78,0.35)] ${theme}`}
            >
              <div className="relative z-10 flex flex-1 flex-col pr-[104px] sm:pr-[120px]">
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${icon_tone}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight text-vv-navy">{title}</h2>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-vv-muted">{text}</p>
                <Link
                  href={href}
                  className={`mt-auto inline-flex w-fit items-center gap-2 pt-5 text-[15px] font-bold after:absolute after:inset-0 after:content-[''] ${link}`}
                >
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-0 h-[150px] w-[150px] sm:h-[165px] sm:w-[165px]">{art}</div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: 1, icon: Landmark, title: "Institution submits data", text: "Approved institutions upload and validate student data.", tone: "bg-[#E6F0FE] text-vv-blue", num: "bg-vv-blue2" },
    { n: 2, icon: UserCheck, title: "Student identity & consent", text: "Students review their records and provide consent using their academic identity.", tone: "bg-vv-greenbg text-vv-green", num: "bg-vv-green" },
    { n: 3, icon: FileCheck2, title: "Records are validated", text: "Data is checked for accuracy, deduplicated and securely stored.", tone: "bg-[#EFEAFD] text-[#6D4FD6]", num: "bg-[#6D4FD6]" },
    { n: 4, icon: ShieldCheck, title: "Verifiable credential", text: "A verifiable academic record is made available with appropriate verification and audit controls.", tone: "bg-vv-orangebg text-vv-saffron", num: "bg-vv-saffron" },
  ];
  return (
    <section aria-labelledby="how-title" className="mx-auto mt-16 max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:gap-8">
        <div>
          <h2 id="how-title" className="text-[30px] font-extrabold leading-tight tracking-tight text-vv-navy">
            How VidyaVerse works
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-vv-muted">
            From institutional data to a verifiable academic identity, built on trust, consent and transparency.
          </p>
        </div>
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden border-t-2 border-dashed border-[#C9D8EE] lg:block" aria-hidden />
          {steps.map(({ n, icon: Icon, title, text, tone, num }) => (
            <li key={n} className="relative">
              <div className="relative flex items-center gap-3">
                <span className={`z-10 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white ${num}`}>{n}</span>
                <span className={`z-10 flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-vv-navy">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-vv-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

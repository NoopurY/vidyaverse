"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useT } from "./providers";
import { LANGS, type Lang } from "@/lib/i18n";
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
    <div className="border-b border-line bg-[#F0F3F7] text-xs">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        <a href="#main" className="font-medium text-navy underline-offset-2 hover:underline">
          {t("skip")}
        </a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1" role="group" aria-label="Text size">
            <button onClick={() => setFs("sm")} className="rounded px-1.5 py-0.5 hover:bg-white" aria-label="Decrease text size">A-</button>
            <button onClick={() => setFs("md")} className="rounded px-1.5 py-0.5 hover:bg-white" aria-label="Default text size">A</button>
            <button onClick={() => setFs("lg")} className="rounded px-1.5 py-0.5 hover:bg-white" aria-label="Increase text size">A+</button>
          </div>
          <span className="h-3 w-px bg-line" aria-hidden />
          <div className="flex items-center gap-1" role="group" aria-label="Language">
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                lang={l}
                aria-pressed={lang === l}
                className={cn("rounded px-1.5 py-0.5 hover:bg-white", lang === l && "bg-white font-semibold text-navy")}
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
  "AICTE_ADMIN:readonly": "Regulator (Read-only)",
  "INSTITUTION:admin": "Institution Admin",
  "INSTITUTION:operator": "Institution Operator",
  "STUDENT:self": "Student",
};

export function SiteHeader() {
  const { t } = useT();
  const { data } = useSession();
  const u = data?.user;
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Home">
          {/* Placeholders: replace with the official emblem / AICTE logo as per usage guidelines */}
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden className="shrink-0">
            <circle cx="22" cy="22" r="21" fill="#E8EEF9" stroke="#0B3D91" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="7" fill="none" stroke="#0B3D91" strokeWidth="1.5" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1="22" y1="22" x2={22 + 7 * Math.cos((i * Math.PI) / 6)} y2={22 + 7 * Math.sin((i * Math.PI) / 6)} stroke="#0B3D91" strokeWidth="0.8" />
            ))}
            <text x="22" y="39" textAnchor="middle" fontSize="5" fill="#0B3D91">EMBLEM</text>
          </svg>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-navy bg-navy text-[10px] font-bold tracking-wide text-white" aria-hidden>
            AICTE
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold text-navy sm:text-lg">{t("portalTitle")}</span>
            <span className="block text-xs text-muted">{t("portalSubtitle")}</span>
          </span>
        </Link>
        {u && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{u.name}</p>
              <p className="text-xs text-muted">{u.institutionName ?? u.region ?? u.email}</p>
            </div>
            <span className="rounded-full bg-navy-tint px-2.5 py-1 text-xs font-semibold text-navy">{ROLE_LABEL[`${u.role}:${u.permission}`] ?? u.role}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-sm text-navy hover:bg-navy-tint">
              <LogOut className="h-4 w-4" aria-hidden />
              {t("logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicNav() {
  const { t } = useT();
  const path = usePathname();
  const items: [string, string][] = [
    ["/", t("home")],
    ["/verify", t("verify")],
    ["/about", t("about")],
    ["/help", t("help")],
    ["/login", t("login")],
  ];
  return (
    <nav className="bg-navy" aria-label="Main">
      <ul className="mx-auto flex max-w-[1400px] flex-wrap px-2">
        {items.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={cn("block px-4 py-3 text-sm font-medium text-white/90 hover:bg-navy-hover hover:text-white", path === href && "bg-navy-hover text-white shadow-[inset_0_-3px_0_#FF9933]")}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const { t } = useT();
  const links: [string, string][] = [
    ["/help", t("help")],
    ["/privacy", t("privacy")],
    ["/terms", t("terms")],
    ["/accessibility", t("accessibility")],
    ["/contact", t("contact")],
    ["/api-docs", "API"],
  ];
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-white/90 underline-offset-2 hover:text-white hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="text-xs text-white/80 md:text-right">
          <p>{t("contentOwned")}</p>
          <p>
            {t("lastUpdated")}: {process.env.NEXT_PUBLIC_LAST_UPDATED ?? "28 Oct 2026"}
          </p>
        </div>
      </div>
    </footer>
  );
}

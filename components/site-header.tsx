"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ArrowRight, Check, ChevronDown, Languages, LogOut, Menu, User, UserRound, X } from "lucide-react";
import { useT } from "./providers";
import { LANGS, type Lang } from "@/lib/i18n";
import { VidyaVerseLogo } from "./brand";
import { cn } from "@/lib/utils";

type FontSize = "sm" | "md" | "lg";

function applyFontSize(v: FontSize) {
  if (v === "md") delete document.documentElement.dataset.fs;
  else document.documentElement.dataset.fs = v;
  try {
    localStorage.setItem("fs", v === "md" ? "" : v);
  } catch {}
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

function MinistryLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/ministry-of-education.png" alt="Ministry of Education, Government of India" className="h-12 w-auto shrink-0 object-contain" />
  );
}

function TextSizeControls({ className }: { className?: string }) {
  const [size, setSize] = useState<FontSize>("md");
  useEffect(() => {
    try {
      const s = localStorage.getItem("fs");
      if (s === "sm" || s === "lg") setSize(s);
    } catch {}
  }, []);
  const pick = (v: FontSize) => {
    setSize(v);
    applyFontSize(v);
  };
  const items: [FontSize, string, string][] = [
    ["sm", "A-", "Decrease text size"],
    ["md", "A", "Default text size"],
    ["lg", "A+", "Increase text size"],
  ];
  return (
    <div className={cn("flex items-center", className)} role="group" aria-label="Text size">
      {items.map(([v, label, aria]) => (
        <button
          key={v}
          type="button"
          onClick={() => pick(v)}
          aria-label={aria}
          aria-pressed={size === v}
          className={cn(
            "h-8 min-w-8 rounded-md px-1.5 text-[13px] font-semibold transition-colors",
            size === v ? "bg-vv-ice text-vv-blue" : "text-vv-muted hover:bg-vv-ice hover:text-vv-blue"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function LanguageMenu() {
  const { lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className="flex h-10 items-center gap-2 rounded-xl border border-vv-line bg-white px-3 text-sm font-medium text-vv-text transition-colors hover:border-vv-blue/40 hover:bg-vv-ice"
      >
        <Languages className="h-4 w-4 text-vv-muted" aria-hidden />
        {LANGS[lang]}
        <ChevronDown className={cn("h-4 w-4 text-vv-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-vv-line bg-white p-1 shadow-dropdown"
        >
          {(Object.keys(LANGS) as Lang[]).map((l) => (
            <li key={l} role="option" aria-selected={lang === l}>
              <button
                type="button"
                lang={l}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  lang === l ? "bg-vv-ice font-semibold text-vv-blue" : "text-vv-text hover:bg-vv-ice"
                )}
              >
                {LANGS[l]}
                {lang === l && <Check className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { t, lang, setLang } = useT();
  const path = usePathname();
  const { data } = useSession();
  const u = data?.user;
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [path]);

  const navItems: [string, string][] = [
    ["/", t("home")],
    ["/verify", t("verify")],
    ["/about", t("about")],
    ["/help", t("help")],
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-vv-line bg-white/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-vv-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Left: government identity + product branding */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden items-center gap-2.5 lg:flex">
            <MinistryLogo />
            <div className="hidden leading-tight 2xl:block">
              <p className="text-[13px] font-semibold text-vv-text">Ministry of Education</p>
              <p className="text-[11px] text-vv-muted">Government of India</p>
            </div>
            <span className="ml-1 hidden h-10 w-px bg-vv-line 2xl:block" aria-hidden />
          </div>
          <Link href="/" aria-label="VidyaVerse homepage" className="flex min-w-0 items-center gap-3">
            <VidyaVerseLogo size={44} />
            <span className="text-[26px] font-extrabold leading-none tracking-tight">
              <span className="text-vv-navy">Vidya</span>
              <span className="text-vv-saffron">Verse</span>
            </span>
            <span className="hidden max-w-[270px] leading-tight min-[1400px]:block">
              <span className="block text-[13px] font-semibold text-vv-text">APAAR Student Data &amp; Verification Portal</span>
              <span className="block text-[11px] text-vv-muted">All India Council for Technical Education</span>
            </span>
          </Link>
        </div>

        {/* Centre: navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "relative whitespace-nowrap px-3.5 py-2 text-sm transition-colors",
                isActive(href) ? "font-bold text-vv-blue" : "font-medium text-vv-text hover:text-vv-blue"
              )}
            >
              {label}
              <span
                className={cn(
                  "absolute inset-x-3.5 -bottom-[17px] h-0.5 rounded-full bg-vv-blue transition-opacity xl:-bottom-[21px]",
                  isActive(href) ? "opacity-100" : "opacity-0"
                )}
                aria-hidden
              />
            </Link>
          ))}
        </nav>

        {/* Right: accessibility + account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <TextSizeControls className="hidden xl:flex" />
          <span className="hidden h-6 w-px bg-vv-line xl:block" aria-hidden />
          <div className="hidden lg:block">
            <LanguageMenu />
          </div>
          {u ? (
            <div className="flex items-center gap-2">
              <Link
                href={ROLE_HOME[u.role] ?? "/"}
                className="flex items-center gap-2.5 rounded-xl border border-vv-line bg-vv-ice p-1.5 pr-3 transition-colors hover:border-vv-blue/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-vv-blue text-xs font-bold text-white">
                  {u.name?.[0] ?? <User className="h-4 w-4" aria-hidden />}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold text-vv-text">{u.name}</span>
                  <span className="block text-[10.5px] text-vv-muted">{ROLE_LABEL[`${u.role}:${u.permission}`] ?? u.role}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label={t("logout")}
                className="hidden h-10 items-center gap-1.5 rounded-xl border border-vv-line px-3 text-sm font-medium text-vv-text transition-colors hover:bg-vv-ice sm:flex"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="group hidden h-11 items-center gap-2 rounded-xl bg-vv-blue px-5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(6,72,181,0.6)] transition-all hover:bg-[#053a96] sm:inline-flex"
            >
              <UserRound className="h-4 w-4" aria-hidden />
              {t("login")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-vv-line text-vv-text transition-colors hover:bg-vv-ice lg:hidden"
          >
            {menu ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {menu && (
        <div id="mobile-menu" className="border-t border-vv-line bg-white px-4 pb-5 pt-3 shadow-dropdown lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {navItems.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-base transition-colors",
                  isActive(href) ? "bg-vv-ice font-bold text-vv-blue" : "font-medium text-vv-text hover:bg-vv-ice"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-vv-line pt-4">
            <TextSizeControls />
            <div className="flex items-center gap-1" role="group" aria-label="Language">
              {(Object.keys(LANGS) as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={cn(
                    "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
                    lang === l ? "bg-vv-blue text-white" : "text-vv-text hover:bg-vv-ice"
                  )}
                >
                  {LANGS[l]}
                </button>
              ))}
            </div>
          </div>
          {!u && (
            <Link
              href="/login"
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-vv-blue text-base font-semibold text-white"
            >
              <UserRound className="h-4 w-4" aria-hidden />
              {t("login")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Search, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useT } from "./providers";
import { StatusBadge } from "./ui";
import { BrandBlock, BuildingArt, TricolourSwoosh } from "./brand";
import { LANGS, type DictKey, type Lang } from "@/lib/i18n";
import { ACADEMIC_YEARS, CURRENT_YEAR } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn, fmtDate } from "@/lib/utils";

export type NavItem = { href: string; label: DictKey; icon: LucideIcon; badge?: "alerts" };

const IDLE_MS = 15 * 60 * 1000;

/* ---------- academic year shared by the top bar and dashboards ---------- */
const YearCtx = createContext<{ year: string; setYear: (y: string) => void }>({ year: CURRENT_YEAR, setYear: () => {} });
export const useAcademicYear = () => useContext(YearCtx);

/** Signs admins out after 15 minutes without interaction; keeps the server session's activity stamp fresh. */
function IdleTimer() {
  const { data, update } = useSession();
  const last = useRef(Date.now());
  const lastPing = useRef(0);
  const role = data?.user?.role;
  useEffect(() => {
    if (role !== "AICTE_ADMIN" && role !== "INSTITUTION") return;
    const bump = () => {
      last.current = Date.now();
      if (Date.now() - lastPing.current > 120_000) {
        lastPing.current = Date.now();
        update().catch(() => {});
      }
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const iv = setInterval(() => {
      const idle = Date.now() - last.current;
      if (idle > IDLE_MS) {
        toast.warning("Signed out after 15 minutes of inactivity");
        signOut({ callbackUrl: "/login?reason=idle" });
      } else if (idle > IDLE_MS - 60_000 && idle < IDLE_MS - 50_000) toast.info("You will be signed out in 1 minute due to inactivity");
    }, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(iv);
    };
  }, [role, update]);
  return null;
}

type AlertItem = { _id: string; message: string; severity: string; status: string; createdAt: string; type: string };
const ALERTS_KEY = "/api/v1/alerts?limit=8";

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open, close]);
  return ref;
}

function NotificationsBell({ alertsHref }: { alertsHref: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const { data, mutate } = useSWR<{ items: AlertItem[]; unread: number }>(ALERTS_KEY, { refreshInterval: 10_000 });
  const ref = useOutsideClose(open, () => setOpen(false));
  const ack = async (id: string) => {
    try {
      await api(`/api/v1/alerts/${id}`, "PATCH", { action: "acknowledge" });
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-full p-2.5 text-ink hover:bg-page" aria-label={`${t("notifications")} (${data?.unread ?? 0} unread)`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {!!data?.unread && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-danger" aria-hidden />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,380px)] rounded border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">
              {t("notifications")} {!!data?.unread && <span className="text-xs font-normal text-muted">· {data.unread} unread</span>}
            </p>
            <Link href={alertsHref} className="text-xs font-medium text-navy hover:underline" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!data?.items.length && <li className="px-4 py-6 text-center text-sm text-muted">No alerts</li>}
            {data?.items.map((a) => (
              <li key={a._id} className="border-b border-line px-4 py-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={a.severity} label={a.severity === "high" ? "High" : a.severity === "medium" ? "Medium" : "Info"} />
                  <span className="text-[11px] text-muted">{fmtDate(a.createdAt, true)}</span>
                </div>
                <p className="mt-1.5 text-sm">{a.message}</p>
                {a.status === "open" && (
                  <button onClick={() => ack(a._id)} className="mt-1.5 text-xs font-medium text-navy hover:underline">
                    Acknowledge
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  "AICTE_ADMIN:full": "AICTE Admin",
  "AICTE_ADMIN:regional": "Regional Officer",
  "AICTE_ADMIN:readonly": "Regulator (Read-only)",
  "INSTITUTION:admin": "Institution Admin",
  "INSTITUTION:operator": "Institution Operator",
  "STUDENT:self": "Student",
};

function setFs(v: "sm" | "md" | "lg") {
  if (v === "md") delete document.documentElement.dataset.fs;
  else document.documentElement.dataset.fs = v;
  try {
    localStorage.setItem("fs", v === "md" ? "" : v);
  } catch {}
}

/** Avatar menu: identity, text size, language, logout */
function UserMenu() {
  const { t, lang, setLang } = useT();
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const u = data?.user;
  if (!u) return null;
  const initials = u.name
    .replace(/^(Dr\.|Prof\.|Shri|Smt\.)\s+/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = ROLE_LABEL[`${u.role}:${u.permission}`] ?? u.role;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-page">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white" aria-hidden>
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-ink">{u.name}</span>
          <span className="block text-xs text-muted">{role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded border border-line bg-white p-2 shadow-lg">
          <div className="border-b border-line px-2 pb-2">
            <p className="text-sm font-semibold">{u.name}</p>
            <p className="truncate text-xs text-muted">{u.institutionName ?? u.region ?? u.email}</p>
          </div>
          <div className="border-b border-line px-2 py-2">
            <p className="mb-1 text-xs text-muted">Text size</p>
            <div className="flex gap-1" role="group" aria-label="Text size">
              {(["sm", "md", "lg"] as const).map((s, i) => (
                <button key={s} onClick={() => setFs(s)} className="rounded border border-line px-2.5 py-1 text-xs hover:bg-navy-tint">
                  {["A-", "A", "A+"][i]}
                </button>
              ))}
            </div>
            <p className="mb-1 mt-2 text-xs text-muted">Language</p>
            <div className="flex gap-1" role="group" aria-label="Language">
              {(Object.keys(LANGS) as Lang[]).map((l) => (
                <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded border px-2.5 py-1 text-xs", lang === l ? "border-navy bg-navy text-white" : "border-line hover:bg-navy-tint")}>
                  {LANGS[l]}
                </button>
              ))}
            </div>
          </div>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/login" })} className="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-danger hover:bg-[#FDECEC]">
            <LogOut className="h-4 w-4" aria-hidden /> {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

function NlSearch() {
  const { t } = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length > 1) router.push(`/aicte/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <label htmlFor="nl-search" className="sr-only">
        Search institutions or ask a question
      </label>
      <input id="nl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="h-11 w-full rounded-full border border-line bg-page pl-10 pr-4 text-sm placeholder:text-muted focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20" />
    </form>
  );
}

function YearPicker() {
  const { t } = useT();
  const { year, setYear } = useAcademicYear();
  return (
    <label className="hidden items-center rounded border border-line bg-white px-3 py-1 md:flex">
      <span className="mr-2 flex flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{t("academicYear")}</span>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="-ml-1 bg-transparent text-sm font-semibold text-ink focus:outline-none" aria-label={t("academicYear")}>
          {[...ACADEMIC_YEARS].reverse().map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

const SEGMENT_LABEL: Record<string, string> = {
  aicte: "AICTE",
  institution: "Institution",
  student: "Student",
  institutions: "Institutions",
  alerts: "Anomalies & Alerts",
  ledger: "Admission Monitoring",
  reports: "Reports & Analytics",
  audit: "Audit Logs",
  settings: "Settings",
  students: "Students",
  upload: "Upload",
  transfers: "Transfers",
  consent: "Consent",
  access: "Access Log",
  outcomes: "Outcomes",
  grievance: "Grievance",
  search: "Search",
};

function Breadcrumbs() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {parts.map((p, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const label = SEGMENT_LABEL[p] ?? (p.length > 14 ? "Details" : decodeURIComponent(p));
          const last = i === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
              {last ? (
                <span aria-current="page" className="font-medium text-ink">{label}</span>
              ) : (
                <Link href={href} className="hover:text-navy hover:underline">{i === 0 ? "Dashboard" : label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SideNavLink({ item, root, onNavigate }: { item: NavItem; root: string; onNavigate: () => void }) {
  const { t } = useT();
  const path = usePathname();
  const params = useSearchParams();
  const [hrefPath, hrefQuery] = item.href.split("?");
  const tab = new URLSearchParams(hrefQuery ?? "").get("tab");
  const active = hrefPath === root ? path === root : path.startsWith(hrefPath) && (tab ? params.get("tab") === tab : !params.get("tab") || hrefPath !== "/aicte/alerts");
  const { data } = useSWR<{ unread: number }>(item.badge === "alerts" ? ALERTS_KEY : null, { refreshInterval: 10_000 });
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
          active ? "bg-[#1F5BD8] font-semibold text-white shadow-sm" : "text-white/85 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span className="flex-1">{t(item.label)}</span>
        {!!data?.unread && (
          <span className="min-w-[22px] rounded-full bg-danger px-1.5 text-center text-[11px] font-bold leading-[20px] text-white" aria-label={`${data.unread} unread`}>
            {data.unread > 99 ? "99+" : data.unread}
          </span>
        )}
      </Link>
    </li>
  );
}

function Sidebar({ nav, footerNav, open, onClose }: { nav: NavItem[]; footerNav: NavItem[]; open: boolean; onClose: () => void }) {
  const { t } = useT();
  const root = nav[0].href;
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-[#0A2A66] text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Portal navigation"
      >
        <div className="relative flex items-start justify-between border-b border-white/10 px-4 pb-4 pt-5">
          <Link href={root} onClick={onClose} aria-label="Dashboard home">
            <BrandBlock />
          </Link>
          <button onClick={onClose} className="absolute right-1.5 top-1.5 rounded p-1 text-white/80 hover:bg-white/10 md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {nav.map((n) => (
              <SideNavLink key={n.href} item={n} root={root} onNavigate={onClose} />
            ))}
          </ul>
          {footerNav.length > 0 && (
            <>
              <hr className="my-4 border-white/10" />
              <ul className="space-y-1">
                {footerNav.map((n) => (
                  <SideNavLink key={n.href} item={n} root={root} onNavigate={onClose} />
                ))}
              </ul>
            </>
          )}
        </nav>
        <div className="relative m-3 hidden overflow-hidden rounded-md bg-white/[0.06] px-4 pb-4 pt-16 lg:block">
          <BuildingArt stroke="rgba(255,255,255,0.28)" className="absolute left-2 top-2 h-[64px] w-[150px]" />
          <p className="relative text-sm font-medium leading-snug text-white/90">{t("sidebarTagline")}</p>
          <div className="relative mt-3 flex h-1 w-24 overflow-hidden rounded-full" aria-hidden>
            <span className="flex-1 bg-saffron" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-indgreen" />
          </div>
        </div>
      </aside>
    </>
  );
}

function PortalFooter() {
  const { t } = useT();
  return (
    <footer className="mt-10 flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {([["/help", t("help")], ["/privacy", t("privacy")], ["/terms", t("terms")], ["/accessibility", t("accessibility")], ["/contact", t("contact")]] as const).map(([h, l]) => (
          <li key={h}>
            <Link href={h} className="hover:text-navy hover:underline">{l}</Link>
          </li>
        ))}
      </ul>
      <p>
        {t("contentOwned")} · {t("lastUpdated")}: 28 Oct 2026
      </p>
    </footer>
  );
}

export function PortalShell({
  nav,
  footerNav = [],
  children,
  search,
  bell = true,
  yearPicker = false,
  alertsHref = "#",
}: {
  nav: NavItem[];
  footerNav?: NavItem[];
  children: React.ReactNode;
  search?: boolean;
  bell?: boolean;
  yearPicker?: boolean;
  alertsHref?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(CURRENT_YEAR);
  return (
    <YearCtx.Provider value={{ year, setYear }}>
      <div className="min-h-screen bg-page">
        <a href="#main" className="sr-only z-[60] rounded bg-white px-3 py-2 text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          {t("skip")}
        </a>
        <IdleTimer />
        <Sidebar nav={nav} footerNav={footerNav} open={open} onClose={() => setOpen(false)} />
        <div className="flex min-h-screen flex-col md:pl-[276px]">
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
            <TricolourSwoosh className="pointer-events-none absolute left-0 top-0 hidden h-6 w-56 opacity-90 lg:block" />
            <div className="relative flex h-[72px] items-center gap-3 px-4 md:px-6">
              <button onClick={() => setOpen(true)} className="rounded p-2 text-navy hover:bg-navy-tint md:hidden" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex flex-1 justify-center lg:pl-40">{search && <NlSearch />}</div>
              {yearPicker && <YearPicker />}
              {bell && <NotificationsBell alertsHref={alertsHref} />}
              <UserMenu />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 md:px-6">
            <Breadcrumbs />
            {children}
            <PortalFooter />
          </main>
        </div>
      </div>
    </YearCtx.Provider>
  );
}

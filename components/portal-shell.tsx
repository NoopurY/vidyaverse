"use client";

import Link from "next/link";
<<<<<<< HEAD
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronRight, Search, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useT } from "./providers";
import { StatusBadge } from "./ui";
import type { DictKey } from "@/lib/i18n";
import { api } from "@/lib/fetcher";
import { cn, fmtDate } from "@/lib/utils";

export type NavItem = { href: string; label: DictKey; icon: LucideIcon };

const IDLE_MS = 15 * 60 * 1000;

/** Signs admins out after 15 minutes without interaction; keeps the server session's activity stamp fresh. */
=======
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "./providers";
import { StatusBadge } from "./ui";
import { VidyaVerseBrand, VidyaVerseLogo } from "./brand";
import { LANGS, type DictKey, type Lang } from "@/lib/i18n";
import { ACADEMIC_YEARS, CURRENT_YEAR } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn, fmtDate } from "@/lib/utils";

export type NavItem = { href: string; label: DictKey; icon: LucideIcon; badge?: "alerts" };

const IDLE_MS = 15 * 60 * 1000;

/* ---------- academic year shared by top bar and dashboards ---------- */
const YearCtx = createContext<{ year: string; setYear: (y: string) => void }>({
  year: CURRENT_YEAR,
  setYear: () => {},
});
export const useAcademicYear = () => useContext(YearCtx);

/** Signs admins out after 15 minutes without interaction; keeps server session fresh */
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
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
<<<<<<< HEAD
      } else if (idle > IDLE_MS - 60_000 && idle < IDLE_MS - 50_000) toast.info("You will be signed out in 1 minute due to inactivity");
=======
      } else if (idle > IDLE_MS - 60_000 && idle < IDLE_MS - 50_000) {
        toast.info("You will be signed out in 1 minute due to inactivity");
      }
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    }, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(iv);
    };
  }, [role, update]);
  return null;
}

type AlertItem = { _id: string; message: string; severity: string; status: string; createdAt: string; type: string };
<<<<<<< HEAD
=======
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
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020

function NotificationsBell({ alertsHref }: { alertsHref: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
<<<<<<< HEAD
  const { data, mutate } = useSWR<{ items: AlertItem[]; unread: number }>("/api/v1/alerts?limit=8", { refreshInterval: 10_000 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
=======
  const { data, mutate } = useSWR<{ items: AlertItem[]; unread: number }>(ALERTS_KEY, { refreshInterval: 10_000 });
  const ref = useOutsideClose(open, () => setOpen(false));
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
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
<<<<<<< HEAD
      <button onClick={() => setOpen((o) => !o)} className="relative rounded p-2 text-navy hover:bg-navy-tint" aria-label={`${t("notifications")} (${data?.unread ?? 0} unread)`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {!!data?.unread && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white">{data.unread > 99 ? "99+" : data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,380px)] rounded border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">{t("notifications")}</p>
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
=======
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-page hover:text-navy focus-visible:ring-2 focus-visible:ring-navy/20"
        aria-label={`${t("notifications")} (${data?.unread ?? 0} unread)`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {!!data?.unread && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-xs">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] rounded-xl border border-line bg-white shadow-dropdown animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-[#F8FAFD]">
            <p className="font-semibold text-sm text-ink">
              {t("notifications")}{" "}
              {!!data?.unread && <span className="text-xs font-normal text-muted">· {data.unread} unread</span>}
            </p>
            <Link
              href={alertsHref}
              className="text-xs font-semibold text-navy hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-line">
            {!data?.items.length && (
              <li className="px-4 py-8 text-center text-xs text-muted">No pending alerts</li>
            )}
            {data?.items.map((a) => (
              <li key={a._id} className="p-3.5 hover:bg-page transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge
                    status={a.severity}
                    label={a.severity === "high" ? "High" : a.severity === "medium" ? "Medium" : "Info"}
                  />
                  <span className="text-[10.5px] text-muted">{fmtDate(a.createdAt, true)}</span>
                </div>
                <p className="mt-1.5 text-xs text-ink leading-snug">{a.message}</p>
                {a.status === "open" && (
                  <button
                    onClick={() => ack(a._id)}
                    className="mt-2 text-[11px] font-semibold text-navy hover:underline"
                  >
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
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

<<<<<<< HEAD
=======
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

/** Avatar menu: user info, accessibility, language, logout */
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
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg border border-line bg-white py-1 pl-1.5 pr-2.5 hover:bg-page transition-colors"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white shadow-xs"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-semibold text-ink line-clamp-1">{u.name}</span>
          <span className="block text-[10.5px] text-muted">{role}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-68 rounded-xl border border-line bg-white p-2 shadow-dropdown animate-in fade-in-0 zoom-in-95"
        >
          <div className="border-b border-line px-3 py-2 bg-[#F8FAFD] rounded-lg">
            <p className="text-xs font-semibold text-ink">{u.name}</p>
            <p className="truncate text-[11px] text-muted">{u.institutionName ?? u.region ?? u.email}</p>
          </div>
          <div className="border-b border-line px-3 py-2.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Text size</p>
            <div className="flex gap-1" role="group" aria-label="Text size">
              {(["sm", "md", "lg"] as const).map((s, i) => (
                <button
                  key={s}
                  onClick={() => setFs(s)}
                  className="rounded border border-line px-2 py-0.5 text-xs font-medium text-ink hover:bg-page"
                >
                  {["A-", "A", "A+"][i]}
                </button>
              ))}
            </div>
            <p className="mb-1 mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Language</p>
            <div className="flex gap-1" role="group" aria-label="Language">
              {(Object.keys(LANGS) as Lang[]).map((l) => (
                <button
                  key={l}
                  lang={l}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                    lang === l
                      ? "border-navy bg-navy text-white shadow-xs"
                      : "border-line text-muted hover:bg-page hover:text-ink"
                  )}
                >
                  {LANGS[l]}
                </button>
              ))}
            </div>
          </div>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-light transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden /> {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
function NlSearch() {
  const { t } = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
<<<<<<< HEAD
      className="relative w-full max-w-xl"
=======
      className="relative w-full max-w-md"
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length > 1) router.push(`/aicte/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <label htmlFor="nl-search" className="sr-only">
<<<<<<< HEAD
        Natural-language search
      </label>
      <input id="nl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="input h-10 pl-9" />
=======
        Search institutions or ask a question
      </label>
      <input
        id="nl-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-9 w-full rounded-lg border border-line bg-page pl-9 pr-3 text-xs text-ink placeholder:text-muted/80 focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/15"
      />
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    </form>
  );
}

<<<<<<< HEAD
const SEGMENT_LABEL: Record<string, string> = {
  aicte: "AICTE",
  institution: "Institution",
  student: "Student",
  institutions: "Institutions",
  alerts: "Alerts & Flags",
  ledger: "Seat Ledger",
  reports: "Reports",
  audit: "Audit Log",
=======
function YearPicker() {
  const { t } = useT();
  const { year, setYear } = useAcademicYear();
  return (
    <label className="hidden items-center rounded-lg border border-line bg-white px-2.5 py-1 md:flex">
      <span className="flex flex-col leading-tight">
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted">{t("academicYear")}</span>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="-ml-0.5 bg-transparent text-xs font-semibold text-navy focus:outline-none"
          aria-label={t("academicYear")}
        >
          {[...ACADEMIC_YEARS].reverse().map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

const SEGMENT_LABEL: Record<string, string> = {
  aicte: "AICTE HQ",
  institution: "Institution",
  student: "Student",
  institutions: "Institutions",
  alerts: "Anomalies & Alerts",
  ledger: "Admission Monitoring",
  reports: "Reports & Analytics",
  audit: "Audit Logs",
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
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

<<<<<<< HEAD
function Breadcrumbs() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
=======
export function Breadcrumbs() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
        {parts.map((p, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const label = SEGMENT_LABEL[p] ?? (p.length > 14 ? "Details" : decodeURIComponent(p));
          const last = i === parts.length - 1;
          return (
<<<<<<< HEAD
            <li key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
              {last ? (
                <span aria-current="page" className="font-medium text-ink">
                  {i === 0 ? "Dashboard" : label}
                </span>
              ) : (
                <Link href={href} className="hover:text-navy hover:underline">
                  {i === 0 ? `${label} Home` : label}
=======
            <li key={href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted/60" aria-hidden />}
              {last ? (
                <span aria-current="page" className="font-semibold text-ink">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-navy hover:underline transition-colors">
                  {i === 0 ? "Dashboard" : label}
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

<<<<<<< HEAD
export function PortalShell({ nav, children, search, bell = true, alertsHref = "#" }: { nav: NavItem[]; children: React.ReactNode; search?: boolean; bell?: boolean; alertsHref?: string }) {
  const { t } = useT();
  const path = usePathname();
  const root = nav[0].href;
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col md:flex-row">
      <IdleTimer />
      <aside className="border-b border-line bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <nav aria-label="Portal" className="md:sticky md:top-0">
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
            {nav.map((n) => {
              const active = n.href === root ? path === root : path.startsWith(n.href);
              const Icon = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-3 whitespace-nowrap rounded px-3 py-2.5 text-sm font-medium text-ink hover:bg-navy-tint hover:text-navy", active && "bg-navy-tint text-navy shadow-[inset_3px_0_0_#0B3D91]")}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                    {t(n.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5 md:px-6">
          {search ? <NlSearch /> : <span />}
          {bell && <NotificationsBell alertsHref={alertsHref} />}
        </div>
        <main id="main" className="flex-1 px-4 py-6 md:px-6" tabIndex={-1}>
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
=======
function SideNavLink({
  item,
  root,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  root: string;
  collapsed?: boolean;
  onNavigate: () => void;
}) {
  const { t } = useT();
  const path = usePathname();
  const params = useSearchParams();
  const [hrefPath, hrefQuery] = item.href.split("?");
  const tab = new URLSearchParams(hrefQuery ?? "").get("tab");
  const active =
    hrefPath === root
      ? path === root
      : path.startsWith(hrefPath) && (tab ? params.get("tab") === tab : !params.get("tab") || hrefPath !== "/aicte/alerts");
  const { data } = useSWR<{ unread: number }>(item.badge === "alerts" ? ALERTS_KEY : null, { refreshInterval: 10_000 });
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={collapsed ? t(item.label) : undefined}
        className={cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
          active
            ? "bg-[#EBF2FA] font-semibold text-navy shadow-xs"
            : "text-muted hover:bg-[#F5F8FC] hover:text-ink"
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-saffron"
            aria-hidden
          />
        )}
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-navy" : "text-muted")} aria-hidden />
        {!collapsed && <span className="flex-1 truncate">{t(item.label)}</span>}
        {!collapsed && !!data?.unread && (
          <span
            className="min-w-4 rounded-full bg-danger px-1.5 text-center text-[10px] font-bold text-white leading-4"
            aria-label={`${data.unread} unread`}
          >
            {data.unread > 99 ? "99+" : data.unread}
          </span>
        )}
      </Link>
    </li>
  );
}

function Sidebar({
  nav,
  footerNav,
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  nav: NavItem[];
  footerNav: NavItem[];
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  const { t } = useT();
  const root = nav[0].href;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white transition-all duration-200 md:translate-x-0",
          collapsed ? "w-[72px]" : "w-[260px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Portal Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-[68px] items-center justify-between border-b border-line px-4">
          <Link href={root} onClick={onClose} aria-label="VidyaVerse Portal Home">
            {collapsed ? (
              <VidyaVerseLogo size={32} />
            ) : (
              <VidyaVerseBrand compact />
            )}
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-page hover:text-ink md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {nav.map((n) => (
              <SideNavLink key={n.href} item={n} root={root} collapsed={collapsed} onNavigate={onClose} />
            ))}
          </ul>
          {footerNav.length > 0 && (
            <>
              <hr className="my-3 border-line" />
              <ul className="space-y-1">
                {footerNav.map((n) => (
                  <SideNavLink key={n.href} item={n} root={root} collapsed={collapsed} onNavigate={onClose} />
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Sidebar Footer / Verification Badge */}
        {!collapsed && (
          <div className="m-3 rounded-xl border border-line bg-[#F8FAFD] p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-navy">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>Verifiable Ecosystem</span>
            </div>
            <p className="mt-1 text-[11px] text-muted leading-tight">
              AICTE digital seat ledger and DPDP-compliant consent.
            </p>
          </div>
        )}

        {/* Collapse toggle button on desktop */}
        <div className="hidden border-t border-line p-2 md:flex justify-end">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 rounded-lg p-1.5 text-xs text-muted hover:bg-page hover:text-navy transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}

function PortalFooter() {
  const { t } = useT();
  return (
    <footer className="mt-12 flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {(
          [
            ["/help", t("help")],
            ["/privacy", t("privacy")],
            ["/terms", t("terms")],
            ["/accessibility", t("accessibility")],
            ["/contact", t("contact")],
          ] as const
        ).map(([h, l]) => (
          <li key={h}>
            <Link href={h} className="hover:text-navy hover:underline transition-colors">
              {l}
            </Link>
          </li>
        ))}
      </ul>
      <p>
        {t("contentOwned")} · Last updated: 28 Oct 2026
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
  const [collapsed, setCollapsed] = useState(false);
  const [year, setYear] = useState(CURRENT_YEAR);

  return (
    <YearCtx.Provider value={{ year, setYear }}>
      <div className="min-h-screen bg-[#F5F8FC]">
        <a
          href="#main"
          className="sr-only z-60 rounded-md bg-white px-3 py-2 text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3 shadow-md"
        >
          {t("skip")}
        </a>
        <IdleTimer />
        <Sidebar
          nav={nav}
          footerNav={footerNav}
          open={open}
          collapsed={collapsed}
          onClose={() => setOpen(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <div
          className={cn(
            "flex min-h-screen flex-col transition-all duration-200",
            collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
          )}
        >
          {/* Top Application Bar */}
          <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-line bg-white/95 px-4 md:px-6 backdrop-blur-md">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-navy hover:bg-page md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center gap-3">{search && <NlSearch />}</div>
            {yearPicker && <YearPicker />}
            {bell && <NotificationsBell alertsHref={alertsHref} />}
            <UserMenu />
          </header>
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 md:px-6 max-w-[1500px] w-full mx-auto">
            <Breadcrumbs />
            {children}
            <PortalFooter />
          </main>
        </div>
      </div>
    </YearCtx.Provider>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

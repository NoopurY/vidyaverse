"use client";

import Link from "next/link";
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

function NotificationsBell({ alertsHref }: { alertsHref: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const { data, mutate } = useSWR<{ items: AlertItem[]; unread: number }>("/api/v1/alerts?limit=8", { refreshInterval: 10_000 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
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
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <label htmlFor="nl-search" className="sr-only">
        Natural-language search
      </label>
      <input id="nl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="input h-10 pl-9" />
    </form>
  );
}

const SEGMENT_LABEL: Record<string, string> = {
  aicte: "AICTE",
  institution: "Institution",
  student: "Student",
  institutions: "Institutions",
  alerts: "Alerts & Flags",
  ledger: "Seat Ledger",
  reports: "Reports",
  audit: "Audit Log",
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
                <span aria-current="page" className="font-medium text-ink">
                  {i === 0 ? "Dashboard" : label}
                </span>
              ) : (
                <Link href={href} className="hover:text-navy hover:underline">
                  {i === 0 ? `${label} Home` : label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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
  );
}

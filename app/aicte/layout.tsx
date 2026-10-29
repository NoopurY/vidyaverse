"use client";

import { AlertTriangle, BookOpenCheck, Building2, FileBarChart, LayoutDashboard, ScrollText, Settings } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/aicte", label: "dashboard", icon: LayoutDashboard },
  { href: "/aicte/institutions", label: "institutions", icon: Building2 },
  { href: "/aicte/alerts", label: "alertsFlags", icon: AlertTriangle },
  { href: "/aicte/ledger", label: "seatLedger", icon: BookOpenCheck },
  { href: "/aicte/reports", label: "reports", icon: FileBarChart },
  { href: "/aicte/audit", label: "auditLog", icon: ScrollText },
  { href: "/aicte/settings", label: "settings", icon: Settings },
];

export default function AicteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={NAV} search alertsHref="/aicte/alerts">
      {children}
    </PortalShell>
  );
}

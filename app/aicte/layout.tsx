"use client";

import { Suspense } from "react";
import { AlertTriangle, BarChart3, Building2, ClipboardCheck, HelpCircle, LayoutDashboard, Network, ScrollText, Settings } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/aicte", label: "dashboard", icon: LayoutDashboard },
  { href: "/aicte/institutions", label: "institutions", icon: Building2 },
  { href: "/aicte/ledger", label: "admissionMonitoring", icon: ClipboardCheck },
  { href: "/aicte/alerts", label: "anomaliesAlerts", icon: AlertTriangle, badge: "alerts" },
  { href: "/aicte/alerts?tab=graph", label: "integrityGraph", icon: Network },
  { href: "/aicte/reports", label: "reportsAnalytics", icon: BarChart3 },
  { href: "/aicte/audit", label: "auditLogs", icon: ScrollText },
];
const FOOTER_NAV: NavItem[] = [
  { href: "/aicte/settings", label: "settings", icon: Settings },
  { href: "/help", label: "helpSupport", icon: HelpCircle },
];

export default function AicteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PortalShell nav={NAV} footerNav={FOOTER_NAV} search yearPicker alertsHref="/aicte/alerts">
        {children}
      </PortalShell>
    </Suspense>
  );
}

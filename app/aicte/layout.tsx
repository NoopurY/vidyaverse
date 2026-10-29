"use client";

<<<<<<< HEAD
import { AlertTriangle, BookOpenCheck, Building2, FileBarChart, LayoutDashboard, ScrollText, Settings } from "lucide-react";
=======
import { Suspense } from "react";
import { AlertTriangle, BarChart3, Building2, ClipboardCheck, HelpCircle, LayoutDashboard, Network, ScrollText, Settings } from "lucide-react";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/aicte", label: "dashboard", icon: LayoutDashboard },
  { href: "/aicte/institutions", label: "institutions", icon: Building2 },
<<<<<<< HEAD
  { href: "/aicte/alerts", label: "alertsFlags", icon: AlertTriangle },
  { href: "/aicte/ledger", label: "seatLedger", icon: BookOpenCheck },
  { href: "/aicte/reports", label: "reports", icon: FileBarChart },
  { href: "/aicte/audit", label: "auditLog", icon: ScrollText },
  { href: "/aicte/settings", label: "settings", icon: Settings },
=======
  { href: "/aicte/ledger", label: "admissionMonitoring", icon: ClipboardCheck },
  { href: "/aicte/alerts", label: "anomaliesAlerts", icon: AlertTriangle, badge: "alerts" },
  { href: "/aicte/alerts?tab=graph", label: "integrityGraph", icon: Network },
  { href: "/aicte/reports", label: "reportsAnalytics", icon: BarChart3 },
  { href: "/aicte/audit", label: "auditLogs", icon: ScrollText },
];
const FOOTER_NAV: NavItem[] = [
  { href: "/aicte/settings", label: "settings", icon: Settings },
  { href: "/help", label: "helpSupport", icon: HelpCircle },
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
];

export default function AicteLayout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <PortalShell nav={NAV} search alertsHref="/aicte/alerts">
      {children}
    </PortalShell>
=======
    <Suspense>
      <PortalShell nav={NAV} footerNav={FOOTER_NAV} search yearPicker alertsHref="/aicte/alerts">
        {children}
      </PortalShell>
    </Suspense>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

"use client";

import { Suspense } from "react";
import { ArrowLeftRight, BarChart3, ClipboardCheck, HelpCircle, LayoutDashboard, Settings, Upload, Users } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/institution", label: "dashboard", icon: LayoutDashboard },
  { href: "/institution/students", label: "students", icon: Users },
  { href: "/institution/upload", label: "upload", icon: Upload },
  { href: "/institution/ledger", label: "seatLedger", icon: ClipboardCheck },
  { href: "/institution/transfers", label: "transfers", icon: ArrowLeftRight },
  { href: "/institution/reports", label: "reportsAnalytics", icon: BarChart3 },
];
const FOOTER_NAV: NavItem[] = [
  { href: "/institution/settings", label: "settings", icon: Settings },
  { href: "/help", label: "helpSupport", icon: HelpCircle },
];

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PortalShell nav={NAV} footerNav={FOOTER_NAV} alertsHref="/institution">
        {children}
      </PortalShell>
    </Suspense>
  );
}

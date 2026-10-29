"use client";

import { ArrowLeftRight, BookOpenCheck, FileBarChart, LayoutDashboard, Settings, Upload, Users } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/institution", label: "dashboard", icon: LayoutDashboard },
  { href: "/institution/students", label: "students", icon: Users },
  { href: "/institution/upload", label: "upload", icon: Upload },
  { href: "/institution/ledger", label: "seatLedger", icon: BookOpenCheck },
  { href: "/institution/transfers", label: "transfers", icon: ArrowLeftRight },
  { href: "/institution/reports", label: "reports", icon: FileBarChart },
  { href: "/institution/settings", label: "settings", icon: Settings },
];

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={NAV} alertsHref="/institution">
      {children}
    </PortalShell>
  );
}

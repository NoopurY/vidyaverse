"use client";

<<<<<<< HEAD
import { ArrowLeftRight, BookOpenCheck, FileBarChart, LayoutDashboard, Settings, Upload, Users } from "lucide-react";
=======
import { Suspense } from "react";
import { ArrowLeftRight, BarChart3, ClipboardCheck, HelpCircle, LayoutDashboard, Settings, Upload, Users } from "lucide-react";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/institution", label: "dashboard", icon: LayoutDashboard },
  { href: "/institution/students", label: "students", icon: Users },
  { href: "/institution/upload", label: "upload", icon: Upload },
<<<<<<< HEAD
  { href: "/institution/ledger", label: "seatLedger", icon: BookOpenCheck },
  { href: "/institution/transfers", label: "transfers", icon: ArrowLeftRight },
  { href: "/institution/reports", label: "reports", icon: FileBarChart },
  { href: "/institution/settings", label: "settings", icon: Settings },
=======
  { href: "/institution/ledger", label: "seatLedger", icon: ClipboardCheck },
  { href: "/institution/transfers", label: "transfers", icon: ArrowLeftRight },
  { href: "/institution/reports", label: "reportsAnalytics", icon: BarChart3 },
];
const FOOTER_NAV: NavItem[] = [
  { href: "/institution/settings", label: "settings", icon: Settings },
  { href: "/help", label: "helpSupport", icon: HelpCircle },
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
];

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <PortalShell nav={NAV} alertsHref="/institution">
      {children}
    </PortalShell>
=======
    <Suspense>
      <PortalShell nav={NAV} footerNav={FOOTER_NAV} alertsHref="/institution">
        {children}
      </PortalShell>
    </Suspense>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

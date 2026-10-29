"use client";

<<<<<<< HEAD
import { FileWarning, History, IdCard, ShieldCheck, Trophy } from "lucide-react";
=======
import { Suspense } from "react";
import { FileWarning, HelpCircle, History, IdCard, ShieldCheck, Trophy } from "lucide-react";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/student", label: "myRecord", icon: IdCard },
  { href: "/student/consent", label: "consent", icon: ShieldCheck },
  { href: "/student/access", label: "accessLog", icon: History },
  { href: "/student/outcomes", label: "outcomes", icon: Trophy },
  { href: "/student/grievance", label: "grievance", icon: FileWarning },
];
<<<<<<< HEAD

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={NAV} bell={false}>
      {children}
    </PortalShell>
=======
const FOOTER_NAV: NavItem[] = [{ href: "/help", label: "helpSupport", icon: HelpCircle }];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PortalShell nav={NAV} footerNav={FOOTER_NAV} bell={false}>
        {children}
      </PortalShell>
    </Suspense>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

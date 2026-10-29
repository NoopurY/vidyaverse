"use client";

import { FileWarning, History, IdCard, ShieldCheck, Trophy } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";

const NAV: NavItem[] = [
  { href: "/student", label: "myRecord", icon: IdCard },
  { href: "/student/consent", label: "consent", icon: ShieldCheck },
  { href: "/student/access", label: "accessLog", icon: History },
  { href: "/student/outcomes", label: "outcomes", icon: Trophy },
  { href: "/student/grievance", label: "grievance", icon: FileWarning },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={NAV} bell={false}>
      {children}
    </PortalShell>
  );
}

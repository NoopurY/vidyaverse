"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ArrowLeftRight, ClipboardList, FileWarning, MessageSquareWarning, Upload } from "lucide-react";
import { Card, CardBody, CardHeader, ErrorNote, Kpi, PageHeader, Progress, SkeletonRows, StatusBadge } from "@/components/ui";
import { AlertsFeed } from "@/components/aicte/alerts-feed";
import type { InstitutionDetail } from "@/components/shared/types";
import { fmtNum, fmtPct } from "@/lib/utils";

export default function InstitutionDashboard() {
  const { data: session } = useSession();
  const id = session?.user?.institutionId;
  const { data, error, isLoading } = useSWR<InstitutionDetail>(id ? `/api/v1/institutions/${id}` : null, { refreshInterval: 10_000 });
  if (isLoading || !data) return error ? <ErrorNote error={error} /> : <SkeletonRows rows={10} />;
  const { institution: inst, metrics: m, pending } = data;
  const badgeText = inst.badge === "green" ? "Compliant" : inst.badge === "amber" ? "Needs Attention" : "Non-Compliant";
  const pendingItems = [
    { label: "Open issues", value: pending.openIssues, href: "/institution/students?flagged=1", icon: ClipboardList },
    { label: "Uploads awaiting approval", value: pending.uploadsAwaitingApproval, href: "/institution/upload", icon: Upload },
    { label: "Transfers pending", value: pending.transfers, href: "/institution/transfers", icon: ArrowLeftRight },
    { label: "Counselling mismatches", value: pending.counsellingMismatches, href: "/institution/students?flagged=1", icon: FileWarning },
    { label: "Student grievances", value: pending.grievances, href: "/institution/students", icon: MessageSquareWarning },
  ];
  return (
    <>
      <PageHeader title={inst.name} description={`${inst.aicteId} · ${inst.state} · Academic year 2025-26`} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Compliance score</p>
          <div className={inst.badge === "green" ? "my-3 flex h-28 w-28 items-center justify-center rounded-full border-8 border-success" : inst.badge === "amber" ? "my-3 flex h-28 w-28 items-center justify-center rounded-full border-8 border-warning" : "my-3 flex h-28 w-28 items-center justify-center rounded-full border-8 border-danger"}>
            <span className="text-3xl font-semibold">{inst.complianceScore}</span>
          </div>
          <StatusBadge status={inst.badge} label={badgeText} />
          <p className="mt-3 text-xs text-muted">Score = 100 − weighted open issues (high 5, medium 2, low 1)</p>
        </Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Approved intake" value={fmtNum(m.intake)} />
          <Kpi label="Enrolled" value={fmtNum(m.enrolled)} />
          <Kpi label="Fill %" value={fmtPct(m.fillPct)} tone={m.fillPct >= 100 ? "danger" : m.fillPct >= 90 ? "warning" : undefined} />
          <Kpi label="Seats remaining" value={fmtNum(m.seatsRemaining)} />
          <Card className="col-span-2 p-4 md:col-span-4">
            <p className="mb-3 text-sm font-semibold">Pending items</p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {pendingItems.map((p) => (
                <li key={p.label}>
                  <Link href={p.href} className="flex items-center gap-3 rounded border border-line px-3 py-2.5 hover:bg-navy-tint">
                    <p.icon className="h-5 w-5 text-navy" aria-hidden />
                    <span className="min-w-0">
                      <span className={p.value ? "block text-lg font-semibold text-danger" : "block text-lg font-semibold"}>{p.value}</span>
                      <span className="block text-xs text-muted">{p.label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Programs – seats" description="Approved / consumed / remaining (regular seats)" action={<Link href="/institution/ledger" className="text-sm font-medium text-navy hover:underline">Full ledger</Link>} />
          <CardBody className="space-y-4">
            {inst.programs.map((p) => {
              const reg = data.ledger.find((l) => l.programId === p.programId && l.seatType === "regular");
              const sup = data.ledger.filter((l) => l.programId === p.programId && l.seatType !== "regular");
              return (
                <div key={p.programId}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{p.name} <span className="text-xs text-muted">({p.programId})</span></span>
                    <span className="text-muted">
                      {reg?.consumed ?? 0} / {reg?.approved ?? p.approvedIntake} · <span className={reg && reg.remaining <= 0 ? "font-semibold text-danger" : ""}>{reg?.remaining ?? 0} left</span>
                    </span>
                  </div>
                  <Progress value={reg?.consumed ?? 0} max={reg?.approved ?? p.approvedIntake} label={`${p.name} seats`} />
                  {sup.length > 0 && <p className="mt-1 text-xs text-muted">Supernumerary: {sup.map((s) => `${s.seatType.toUpperCase()} ${s.consumed}/${s.approved}`).join(" · ")}</p>}
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Alerts" description="Intake breaches and flags for your institution" />
          <AlertsFeed compact limit={10} />
        </Card>
      </div>
    </>
  );
}

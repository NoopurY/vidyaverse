"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileWarning,
  Layers,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorNote,
  Kpi,
  Progress,
  SkeletonRows,
  StatusBadge,
} from "@/components/ui";
import { AlertsFeed } from "@/components/aicte/alerts-feed";
import { WelcomeHero } from "@/components/welcome-hero";
import type { InstitutionDetail } from "@/components/shared/types";
import { fmtNum, fmtPct } from "@/lib/utils";

export default function InstitutionDashboard() {
  const { data: session } = useSession();
  const id = session?.user?.institutionId;
  const { data, error, isLoading } = useSWR<InstitutionDetail>(
    id ? `/api/v1/institutions/${id}` : null,
    { refreshInterval: 10_000 }
  );

  if (isLoading || !data) {
    return error ? <ErrorNote error={error} /> : <SkeletonRows rows={10} />;
  }

  const { institution: inst, metrics: m, pending } = data;
  const badgeText =
    inst.badge === "green"
      ? "Fully Compliant"
      : inst.badge === "amber"
      ? "Needs Attention"
      : "Non-Compliant";

  const pendingItems = [
    {
      label: "Open Validation Issues",
      value: pending.openIssues,
      href: "/institution/students?flagged=1",
      icon: ClipboardList,
      tone: pending.openIssues > 0 ? "danger" : "neutral",
    },
    {
      label: "Uploads Awaiting Approval",
      value: pending.uploadsAwaitingApproval,
      href: "/institution/upload",
      icon: Upload,
      tone: pending.uploadsAwaitingApproval > 0 ? "warning" : "neutral",
    },
    {
      label: "Transfers Pending",
      value: pending.transfers,
      href: "/institution/transfers",
      icon: ArrowLeftRight,
      tone: "neutral",
    },
    {
      label: "Counselling Mismatches",
      value: pending.counsellingMismatches,
      href: "/institution/students?flagged=1",
      icon: FileWarning,
      tone: pending.counsellingMismatches > 0 ? "danger" : "neutral",
    },
    {
      label: "Student Grievances",
      value: pending.grievances,
      href: "/institution/students",
      icon: MessageSquareWarning,
      tone: pending.grievances > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeHero
        title="Institution Overview"
        subtitle={`${inst.name} · AICTE ID: ${inst.aicteId} · ${inst.district ?? ""}, ${inst.state} · Academic Year 2025-26. Monitor student records, submissions, validation results, and approved intake.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="md">
              <Link href="/institution/upload">
                <Upload className="h-4 w-4" /> Submit Student Data
              </Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/institution/students">
                <Users className="h-4 w-4" /> View Records
              </Link>
            </Button>
          </div>
        }
      />

      {/* Top Overview: Compliance Score & 4 KPI Cards */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Compliance Gauge Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center border border-line">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Institutional Compliance</p>
          <div
            className={
              inst.badge === "green"
                ? "my-4 flex h-28 w-28 items-center justify-center rounded-full border-8 border-success bg-success/5 shadow-xs"
                : inst.badge === "amber"
                ? "my-4 flex h-28 w-28 items-center justify-center rounded-full border-8 border-warning bg-warning/5 shadow-xs"
                : "my-4 flex h-28 w-28 items-center justify-center rounded-full border-8 border-danger bg-danger/5 shadow-xs"
            }
          >
            <span className="text-3xl font-extrabold text-ink">{inst.complianceScore}</span>
            <span className="text-xs text-muted">/100</span>
          </div>
          <StatusBadge status={inst.badge} label={badgeText} />
          <p className="mt-3 text-[11px] text-muted max-w-[220px]">
            Score deduction calculated from weighted open issues and counselling discrepancies.
          </p>
        </Card>

        {/* 4 Compact KPIs and Pending Actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="Total Enrolled"
            value={fmtNum(m.enrolled)}
            hint="Active student records"
            icon={<Users className="h-4 w-4" />}
          />
          <Kpi
            label="Approved Intake"
            value={fmtNum(m.intake)}
            hint="AICTE approved capacity"
            icon={<Building2 className="h-4 w-4" />}
          />
          <Kpi
            label="Seat Fill Rate"
            value={fmtPct(m.fillPct)}
            tone={m.fillPct >= 100 ? "danger" : m.fillPct >= 90 ? "warning" : undefined}
            hint={m.fillPct >= 100 ? "Capacity reached" : "Regular intake"}
          />
          <Kpi
            label="Available Seats"
            value={fmtNum(m.seatsRemaining)}
            tone={m.seatsRemaining <= 0 ? "danger" : "success"}
            hint="Remaining seat tokens"
          />

          {/* Pending items workflow strip */}
          <Card className="col-span-2 sm:col-span-4 p-5">
            <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
              <h2 className="card-title text-sm">Action Items Requiring Attention</h2>
              <span className="text-[11px] text-muted">Real-time status</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {pendingItems.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.label}>
                    <Link
                      href={p.href}
                      className="flex items-center gap-3 rounded-lg border border-line p-3 transition-colors hover:border-navy hover:bg-navy-light/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-light text-navy">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={
                            p.value > 0 && p.tone === "danger"
                              ? "block text-base font-bold text-danger leading-none"
                              : p.value > 0 && p.tone === "warning"
                              ? "block text-base font-bold text-[#9A6200] leading-none"
                              : "block text-base font-bold text-ink leading-none"
                          }
                        >
                          {p.value}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted truncate">{p.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      {/* Program Seat Ledger & Live Alerts */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Seat Ledger Card */}
        <Card>
          <CardHeader
            title="Program Seat Allocation & Ledger"
            description="Admissions strictly monitored against AICTE authorized program capacities."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/institution/ledger">
                  Full Ledger <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {inst.programs.map((p) => {
              const reg = data.ledger.find(
                (l) => l.programId === p.programId && l.seatType === "regular"
              );
              const sup = data.ledger.filter(
                (l) => l.programId === p.programId && l.seatType !== "regular"
              );
              const isFull = reg && reg.remaining <= 0;

              return (
                <div key={p.programId} className="rounded-xl border border-line bg-page p-3.5">
                  <div className="mb-2 flex items-baseline justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-ink text-sm">{p.name}</span>{" "}
                      <span className="font-mono text-muted text-[11px]">({p.programId})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-ink">
                        {reg?.consumed ?? 0} / {reg?.approved ?? p.approvedIntake} seats
                      </span>{" "}
                      ·{" "}
                      <span className={isFull ? "font-bold text-danger" : "font-medium text-success"}>
                        {reg?.remaining ?? 0} available
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={reg?.consumed ?? 0}
                    max={reg?.approved ?? p.approvedIntake}
                    label={`${p.name} regular seats`}
                  />
                  {sup.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] text-muted border-t border-line/60 pt-1.5">
                      <span className="font-semibold text-navy">Supernumerary:</span>
                      {sup.map((s) => (
                        <span key={s.seatType} className="rounded bg-white px-1.5 py-0.5 border border-line">
                          {s.seatType.toUpperCase()}: {s.consumed}/{s.approved}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Live Alerts Feed */}
        <Card>
          <CardHeader
            title="Institutional Alerts"
            description="Real-time notifications for intake breaches and validation alerts"
          />
          <AlertsFeed compact limit={8} />
        </Card>
      </div>

      {/* Outcome tracking: APAAR-linked, consent-based placement and higher-studies data */}
      <Card>
        <CardHeader
          title="Employability & Outcomes"
          description="Placement and higher-studies progression of your graduates, linked through APAAR and shown only for students who gave consent."
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Graduates tracked" value={fmtNum(m.graduates)} hint="With outcome data" icon={<Users className="h-4 w-4" />} />
            <Kpi label="Placement rate" value={fmtPct(m.placementRate)} tone={m.placementRate >= 60 ? "success" : m.placementRate >= 40 ? "warning" : undefined} hint={`${fmtNum(m.placed)} placed`} />
            <Kpi label="Higher studies" value={fmtPct(m.higherRate)} hint={`${fmtNum(m.higher)} progressed`} />
            <Kpi label="Employability index" value={fmtPct(Math.min(100, m.placementRate + m.higherRate))} hint="Placement + higher studies" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, EmptyState, ErrorNote, Kpi, PageHeader, SkeletonRows, StatusBadge, Tab, TabPanel, Table, Tabs, TabsList } from "@/components/ui";
import { LedgerView } from "@/components/shared/ledger-view";
import { StudentsTable } from "@/components/shared/students-table";
import { IssuesTable } from "@/components/shared/issues-table";
import { ApproveIntakeButton } from "@/components/shared/approve-intake";
import type { InstitutionDetail } from "@/components/shared/types";
import { ISSUE_LABEL } from "@/lib/constants";
import { fmtDate, fmtNum, fmtPct } from "@/lib/utils";

export default function InstitutionDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const perm = session?.user?.permission;
  const readonly = perm === "readonly";
  const { data, error, isLoading, mutate } = useSWR<InstitutionDetail>(`/api/v1/institutions/${params.id}`, { refreshInterval: 10_000 });
  if (isLoading) return <SkeletonRows rows={10} />;
  if (error || !data) return <ErrorNote error={error ?? new Error("Not found")} />;
  const { institution: inst, metrics: m } = data;
  const programs = inst.programs.map((p) => ({ ...p, seats: data.ledger.filter((l) => l.programId === p.programId) }));

  return (
    <>
      <PageHeader
        title={inst.name}
        description={`${inst.aicteId} · ${inst.district ?? ""}, ${inst.state} · ${inst.region} region · ${inst.type}${inst.isDegreeAwarding ? " · Degree-awarding" : ""}`}
        actions={
          <>
            <StatusBadge status={inst.badge} label={`Compliance ${inst.complianceScore} · ${inst.badge === "green" ? "Compliant" : inst.badge === "amber" ? "Needs Attention" : "Non-Compliant"}`} />
            {!readonly && <ApproveIntakeButton institutionId={inst._id} onDone={() => mutate()} />}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Approved intake" value={fmtNum(m.intake)} />
        <Kpi label="Enrolled (2025-26)" value={fmtNum(m.enrolled)} hint={`2024-25: ${fmtNum(m.enrolledBy["2024-25"])}`} />
        <Kpi label="Fill %" value={fmtPct(m.fillPct)} tone={m.fillPct >= 100 ? "danger" : m.fillPct >= 90 ? "warning" : undefined} />
        <Kpi label="Seats remaining" value={fmtNum(m.seatsRemaining)} />
        <Kpi label="Open flags" value={fmtNum(m.openFlags)} tone={m.openFlags ? "danger" : "success"} />
        <Kpi label="Risk score" value={inst.riskScore} tone={inst.riskScore >= 50 ? "danger" : inst.riskScore >= 25 ? "warning" : "success"} />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <Tab value="overview">Overview</Tab>
          <Tab value="ledger">Programs & Seat Ledger</Tab>
          {!readonly && <Tab value="students">Students</Tab>}
          {!readonly && <Tab value="issues">Issues ({data.pending.openIssues})</Tab>}
          {!readonly && <Tab value="audit">Audit trail</Tab>}
        </TabsList>

        <TabPanel value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Risk reasons" description="Human-readable factors behind the risk score" />
              <CardBody>
                {inst.riskReasons.length ? (
                  <ul className="space-y-2">
                    {inst.riskReasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No risk factors detected.</p>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Open flags by type" />
              <CardBody>
                {Object.keys(data.issueCounts).length ? (
                  <ul className="divide-y divide-line">
                    {Object.entries(data.issueCounts).map(([k, v]) => (
                      <li key={k} className="flex justify-between py-2 text-sm">
                        <span>{ISSUE_LABEL[k] ?? k}</span>
                        <Badge tone="red">{v}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No open flags.</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <p>Placement rate: <b>{fmtPct(m.placementRate)}</b></p>
                  <p>Higher studies: <b>{fmtPct(m.higherRate)}</b></p>
                  <p>NBA: <b>{inst.accreditation?.nba ? "Accredited" : "No"}</b></p>
                  <p>NAAC: <b>{inst.accreditation?.naacGrade ?? "—"}</b></p>
                </div>
              </CardBody>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Recent alerts" />
              {data.alerts.length ? (
                <ul className="divide-y divide-line">
                  {data.alerts.map((a) => (
                    <li key={a._id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                      <StatusBadge status={a.severity} label={a.severity} />
                      <span className="flex-1">{a.message}</span>
                      <span className="text-xs text-muted">{fmtDate(a.createdAt, true)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No alerts for this institution" />
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="ledger">
          <Card>
            <CardHeader title="Seat ledger – 2025-26" description="One token per approved seat; admissions consume tokens atomically" />
            <CardBody>
              <LedgerView programs={programs} />
            </CardBody>
          </Card>
        </TabPanel>

        {!readonly && (
          <TabPanel value="students">
            <Card>
              <StudentsTable institutionId={inst._id} programs={inst.programs} />
            </Card>
          </TabPanel>
        )}
        {!readonly && (
          <TabPanel value="issues">
            <Card>
              <IssuesTable items={data.issues} canOverride onChange={() => mutate()} />
            </Card>
          </TabPanel>
        )}
        {!readonly && (
          <TabPanel value="audit">
            <Card>
              {data.audit.length ? (
                <Table caption="Audit trail">
                  <thead>
                    <tr>{["#", "When", "Actor", "Action", "Hash"].map((h) => <th key={h} className="th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.audit.map((a) => (
                      <tr key={a._id}>
                        <td className="td">{a.seq}</td>
                        <td className="td whitespace-nowrap">{fmtDate(a.timestamp, true)}</td>
                        <td className="td">{a.actor}</td>
                        <td className="td font-mono text-xs">{a.action}</td>
                        <td className="td font-mono text-xs text-muted">{a.hash.slice(0, 16)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState title="No audit entries yet" />
              )}
            </Card>
          </TabPanel>
        )}
      </Tabs>
    </>
  );
}

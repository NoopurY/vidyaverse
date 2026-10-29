"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, EmptyState, ErrorNote, Kpi, Skeleton, StatusBadge, Table, Tip } from "@/components/ui";
import { AlertsFeed } from "@/components/aicte/alerts-feed";
import { IndiaMap } from "@/components/aicte/india-map";
import { WhatsAppSimulator } from "@/components/aicte/whatsapp-simulator";
import { useT } from "@/components/providers";
import { WelcomeHero } from "@/components/welcome-hero";
import { useAcademicYear } from "@/components/portal-shell";
import { api, qs } from "@/lib/fetcher";
import { fmtNum, fmtPct } from "@/lib/utils";

const TrendChart = dynamic(() => import("@/components/aicte/charts").then((m) => m.TrendChart), { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> });
const CategoryChart = dynamic(() => import("@/components/aicte/charts").then((m) => m.CategoryChart), { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> });
const OutcomesChart = dynamic(() => import("@/components/aicte/charts").then((m) => m.OutcomesChart), { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> });

type Dash = {
  year: string;
  scope: string;
  state: string | null;
  kpis: { institutions: number; approvedIntake: number; enrolled: number; fillPct: number; activeFlags: number; seatsRemaining: number };
  states: { state: string; code: string; fillPct: number; flags: number; institutions: number; enrolled: number }[];
  institutions: { id: string; name: string; district?: string; intake: number; enrolled: number; fillPct: number; flags: number; riskScore: number; badge: string }[];
  highRisk: { id: string; name: string; state: string; riskScore: number; badge: string; complianceScore: number; reasons: string[] }[];
  trend: { year: string; enrolled: number }[];
  categorySplit: { name: string; value: number }[];
  outcomes: { graduates: number; placementRate: number; higherRate: number };
  outcomesByState: { state: string; placement: number; higher: number }[];
};

export default function AicteDashboard() {
  const { t } = useT();
  const { data: session } = useSession();
  const readonly = session?.user?.permission === "readonly";
  const [state, setState] = useState<string | null>(null);
  const { year } = useAcademicYear();
  const [metric, setMetric] = useState<"fill" | "flags">("fill");
  const [running, setRunning] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<Dash>(`/api/v1/dashboard${qs({ state, year })}`, { refreshInterval: 10_000, keepPreviousData: true });

  const runChecks = async () => {
    setRunning(true);
    try {
      const r = await api<{ ms: number; result: Record<string, { flagged?: number; created?: number }> }>("/api/v1/checks/run", "POST");
      const created = Object.values(r.result).reduce((a, x) => a + (x?.created ?? 0), 0);
      toast.success(`Checks completed in ${(r.ms / 1000).toFixed(1)}s`, { description: `${created} new flag(s). Risk scores recomputed.` });
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const k = data?.kpis;
  return (
    <>
      <WelcomeHero
        title="AICTE Student Intelligence Portal"
        subtitle={`Monitor admissions, verify academic identities and ensure a transparent and compliant higher education ecosystem. ${state ? `Viewing: ${state}` : `Scope: ${data?.scope ?? "National"}`} · ${year}`}
        actions={
          !readonly && (
            <Button onClick={runChecks} loading={running}>
              <PlayCircle className="h-4 w-4" aria-hidden /> {t("runChecks")}
            </Button>
          )
        }
      />
      <ErrorNote error={error} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {isLoading || !k ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)
        ) : (
          <>
            <Kpi label="Institutions" value={fmtNum(k.institutions)} />
            <Kpi label="Approved intake" value={fmtNum(k.approvedIntake)} />
            <Kpi label="Enrolled" value={fmtNum(k.enrolled)} hint={year} />
            <Kpi label="Fill %" value={fmtPct(k.fillPct)} tone={k.fillPct >= 100 ? "danger" : k.fillPct >= 90 ? "warning" : undefined} />
            <Kpi label="Active flags" value={fmtNum(k.activeFlags)} tone={k.activeFlags ? "danger" : "success"} />
            <Kpi label="Seats remaining" value={fmtNum(k.seatsRemaining)} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title={state ? `${state}` : "India – by state"}
            description={state ? "Institutions in this state are listed below" : "Click a state to drill down"}
            action={
              <div className="flex items-center gap-2">
                {state && (
                  <Button size="sm" variant="secondary" onClick={() => setState(null)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden /> National
                  </Button>
                )}
                <div className="flex rounded border border-line p-0.5" role="group" aria-label="Map metric">
                  {(["fill", "flags"] as const).map((m) => (
                    <button key={m} onClick={() => setMetric(m)} aria-pressed={metric === m} className={metric === m ? "rounded bg-navy px-3 py-1 text-xs font-medium text-white" : "rounded px-3 py-1 text-xs text-navy"}>
                      {m === "fill" ? "Fill %" : "Flags"}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
          <CardBody>{data ? <IndiaMap data={data.states} metric={metric} selected={state} onSelect={setState} /> : <Skeleton className="h-[420px]" />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Live alerts" description="Auto-refreshes every 10 s" action={<Link href="/aicte/alerts" className="text-sm font-medium text-navy hover:underline">View all</Link>} />
          <AlertsFeed compact canAct={!readonly} />
        </Card>
      </div>

      {state && (
        <Card className="mt-6">
          <CardHeader title={`Institutions in ${state}`} description="Click an institution for programs, seat ledger, students and issues" />
          {data?.institutions.length ? (
            <Table caption={`Institutions in ${state}`}>
              <thead>
                <tr>
                  {["Institution", "District", "Intake", "Enrolled", "Fill %", "Flags", "Risk", "Badge"].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.institutions.map((i) => (
                  <tr key={i.id} className="hover:bg-page">
                    <td className="td font-medium">
                      <Link href={`/aicte/institutions/${i.id}`} className="text-navy hover:underline">{i.name}</Link>
                    </td>
                    <td className="td">{i.district}</td>
                    <td className="td">{fmtNum(i.intake)}</td>
                    <td className="td">{fmtNum(i.enrolled)}</td>
                    <td className="td">{fmtPct(i.fillPct)}</td>
                    <td className="td">{i.flags}</td>
                    <td className="td font-semibold">{i.riskScore}</td>
                    <td className="td"><StatusBadge status={i.badge} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No institutions in scope for this state" />
          )}
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="High-risk institutions" description="Risk score 0–100 with the top human-readable reasons" />
        {!data ? (
          <Skeleton className="m-5 h-40" />
        ) : data.highRisk.length ? (
          <Table caption="High-risk institutions">
            <thead>
              <tr>
                {["Institution", "State", "Risk score", "Compliance", "Top reasons", ""].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.highRisk.map((r) => (
                <tr key={r.id} className={r.riskScore >= 50 ? "flagged-row" : undefined}>
                  <td className="td font-medium">
                    {r.riskScore >= 50 ? (
                      <Tip content={r.reasons[0] ?? "High risk"}>
                        <span tabIndex={0}>{r.name}</span>
                      </Tip>
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="td">{r.state}</td>
                  <td className="td">
                    <span className={r.riskScore >= 50 ? "font-semibold text-danger" : r.riskScore >= 25 ? "font-semibold text-[#7A5A00]" : "font-semibold"}>{r.riskScore}</span>
                  </td>
                  <td className="td"><StatusBadge status={r.badge} label={`${r.complianceScore} · ${r.badge === "green" ? "Compliant" : r.badge === "amber" ? "Needs Attention" : "Non-Compliant"}`} /></td>
                  <td className="td text-xs text-muted">
                    <ul className="list-disc pl-4">
                      {r.reasons.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                  </td>
                  <td className="td">
                    <Link href={`/aicte/institutions/${r.id}`} className="text-sm font-medium text-navy hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No risk signals" body="Run checks to recompute risk scores." />
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Enrolment trend (YoY)" />
          <CardBody>{data && <TrendChart data={data.trend} />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Category split" description={year} />
          <CardBody>{data && <CategoryChart data={data.categorySplit} />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Outcomes rate" description={data ? `Placement ${fmtPct(data.outcomes.placementRate)} · Higher studies ${fmtPct(data.outcomes.higherRate)}` : undefined} />
          <CardBody>{data && <OutcomesChart data={data.outcomesByState} />}</CardBody>
        </Card>
      </div>

      {!readonly && (
        <Card className="mt-6">
          <CardHeader title="WhatsApp Simulator" description="Demo the bot without real keys: employer verification, student consent replies and institution alerts" />
          <CardBody>
            <WhatsAppSimulator />
          </CardBody>
        </Card>
      )}
    </>
  );
}

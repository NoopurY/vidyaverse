"use client";

<<<<<<< HEAD
import { useState } from "react";
=======
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorNote, PageHeader, Pagination, Select, SkeletonRows, Tab, TabPanel, Tabs, TabsList } from "@/components/ui";
import { AlertsFeed } from "@/components/aicte/alerts-feed";
import { FraudGraph } from "@/components/aicte/fraud-graph";
import { IssuesTable } from "@/components/shared/issues-table";
import type { IssueRow } from "@/components/shared/types";
import { api, qs } from "@/lib/fetcher";
import { ISSUE_LABEL } from "@/lib/constants";

type IssuesResp = { items: IssueRow[]; total: number; page: number; limit: number; byType: Record<string, number> };

function IssuesTab({ readonly }: { readonly: boolean }) {
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR<IssuesResp>(`/api/v1/issues${qs({ type, severity, page, limit: 25 })}`, { keepPreviousData: true, refreshInterval: 10_000 });
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <Select aria-label="Issue type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="w-64">
          <option value="">All types</option>
          {Object.entries(ISSUE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}{data?.byType[k] ? ` (${data.byType[k]})` : ""}</option>)}
        </Select>
        <Select aria-label="Severity" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className="w-40">
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>
      <ErrorNote error={error} />
      {isLoading ? <SkeletonRows rows={8} /> : (
        <>
          <IssuesTable items={data?.items ?? []} showInstitution canOverride={!readonly} onChange={() => mutate()} />
          {data && data.total > 0 && <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />}
        </>
      )}
    </Card>
  );
}

function DuplicateReview({ readonly }: { readonly: boolean }) {
  const { data, isLoading, mutate } = useSWR<IssuesResp>(`/api/v1/issues?type=fuzzy_duplicate&limit=50`);
  const decide = async (id: string, action: "same-person" | "different-person") => {
    try {
      await api(`/api/v1/issues/${id}`, "PATCH", { action });
      toast.success(action === "same-person" ? "Marked as same person – institution asked to remove the duplicate" : "Marked as different persons");
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  if (isLoading) return <SkeletonRows rows={4} />;
  if (!data?.items.length) return <Card><EmptyState title="No possible duplicates to review" body="Fuzzy matches (phonetic name + same DOB + same parent) appear here for a decision." /></Card>;
  return (
    <div className="space-y-4">
      {data.items.map((i) => (
        <Card key={i._id}>
          <CardHeader title={<span className="flex items-center gap-2">Possible same person <Badge tone="amber">similarity {(i.meta?.score ?? 0).toFixed(2)}</Badge></span>} description={i.institutionName} />
          <CardBody className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div className="rounded border border-line p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted">New / flagged record</p>
              <p className="mt-1 font-semibold">{i.meta?.name ?? "—"}</p>
              <p className="text-muted">DOB {i.meta?.dob ?? "—"} · APAAR {i.studentApaar ?? "missing"}</p>
            </div>
            <div className="rounded border border-line p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted">Existing record</p>
              <p className="mt-1 font-semibold">{i.candidate?.name ?? i.details}</p>
              <p className="text-muted">DOB {i.candidate?.dob ?? "—"} · APAAR {i.candidate?.apaarId ?? i.meta?.candidateApaar ?? "—"}{i.candidate?.institution && ` · ${i.candidate.institution}`}</p>
            </div>
            {!readonly && (
              <div className="flex flex-col gap-2">
                <Button variant="danger" onClick={() => decide(i._id, "same-person")}>Same person</Button>
                <Button variant="secondary" onClick={() => decide(i._id, "different-person")}>Different person</Button>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const { data: session } = useSession();
  const readonly = session?.user?.permission === "readonly";
  const [status, setStatus] = useState("");
<<<<<<< HEAD
  return (
    <>
      <PageHeader title="Alerts & Flags" description="Real-time alerts, validation issues, duplicate review and the fraud graph." />
      <Tabs defaultValue="alerts">
=======
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState(params.get("tab") ?? "alerts");
  useEffect(() => setTab(params.get("tab") ?? "alerts"), [params]);
  const changeTab = (v: string) => {
    setTab(v);
    router.replace(v === "alerts" ? "/aicte/alerts" : `/aicte/alerts?tab=${v}`, { scroll: false });
  };
  return (
    <>
      <PageHeader title="Anomalies & Alerts" description="Real-time alerts, validation issues, duplicate review and the fraud graph." />
      <Tabs value={tab} onValueChange={changeTab}>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
        <TabsList>
          <Tab value="alerts">Alerts</Tab>
          {!readonly && <Tab value="issues">Validation Issues</Tab>}
          {!readonly && <Tab value="duplicates">Duplicate Review</Tab>}
          {!readonly && <Tab value="graph">Fraud Graph</Tab>}
        </TabsList>
        <TabPanel value="alerts">
          <Card>
            <CardHeader
              title="Alerts feed"
              description="Updates every 10 seconds"
              action={
                <Select aria-label="Alert status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </Select>
              }
            />
            <AlertsFeed limit={50} canAct={!readonly} query={status ? `&status=${status}` : ""} />
          </Card>
        </TabPanel>
        {!readonly && (
          <>
            <TabPanel value="issues"><IssuesTab readonly={readonly} /></TabPanel>
            <TabPanel value="duplicates"><DuplicateReview readonly={readonly} /></TabPanel>
            <TabPanel value="graph">
              <Card>
                <CardHeader title="Fraud graph" description="Students, institutions and shared phone numbers (masked). Red = shared contact ≥ threshold or a student linked to 2+ institutions." />
                <CardBody><FraudGraph /></CardBody>
              </Card>
            </TabPanel>
          </>
        )}
      </Tabs>
    </>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { CheckCircle2, Clock, Link2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, EmptyState, ErrorNote, Field, Input, PageHeader, Pagination, SkeletonRows, Table } from "@/components/ui";
import { fetcher, qs } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type Entry = { _id: string; seq: number; actor: string; role: string; action: string; entity?: string; entityId?: string; ip?: string; timestamp: string; prevHash: string; hash: string };
type Chain = { intact: boolean; checked: number; brokenAt?: number; reason?: string };
type History = { asOf: string; records: { institutionId: string; currentVersion: number; asOf: { version: number; changedAt: string; changedBy: string; snapshot: Record<string, unknown> } | null; versions: { version: number; changedAt: string; changedBy: string; diff: Record<string, unknown> }[] }[] };

function TimeTravel() {
  const [apaar, setApaar] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <CardHeader title="Time-travel view" description="See any student record as it was on a past date (rebuilt from version history)" />
      <CardBody>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              setData(await fetcher<History>(`/api/v1/students/${apaar}/history${qs({ asOf: date })}`));
            } catch (err) {
              toast.error((err as Error).message);
              setData(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="APAAR ID" htmlFor="tt-apaar"><Input id="tt-apaar" required pattern="\d{12}" maxLength={12} value={apaar} onChange={(e) => setApaar(e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="As of date" htmlFor="tt-date"><Input id="tt-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Button type="submit" loading={busy}><Clock className="h-4 w-4" aria-hidden /> View</Button>
        </form>
        {data && (
          <div className="mt-5 space-y-4">
            {data.records.map((r) => (
              <div key={r.institutionId} className="rounded border border-line">
                <p className="border-b border-line bg-page px-4 py-2 text-sm">
                  {r.asOf ? <>Version <b>{r.asOf.version}</b> of {r.currentVersion} · saved {fmtDate(r.asOf.changedAt, true)} by {r.asOf.changedBy}</> : "No version existed on this date"}
                </p>
                {r.asOf && (
                  <dl className="grid gap-x-6 gap-y-1 p-4 text-sm sm:grid-cols-3">
                    {Object.entries(r.asOf.snapshot).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-dashed border-line py-1">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right font-medium">{typeof v === "object" && v ? JSON.stringify(v) : String(v ?? "—")}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <details className="border-t border-line px-4 py-2 text-xs">
                  <summary className="cursor-pointer font-medium text-navy">All versions ({r.versions.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {r.versions.map((v) => <li key={v.version}>v{v.version} · {fmtDate(v.changedAt, true)} · {v.changedBy} · <span className="font-mono">{JSON.stringify(v.diff)}</span></li>)}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function AuditPage() {
  const { data: session } = useSession();
  const readonly = session?.user?.permission === "readonly";
  const [page, setPage] = useState(1);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [filters, setFilters] = useState({ actor: "", action: "" });
  const [chain, setChain] = useState<Chain | null>(null);
  const [checking, setChecking] = useState(false);
  const { data, error, isLoading } = useSWR<{ items: Entry[]; total: number; page: number; limit: number }>(readonly ? null : `/api/v1/audit${qs({ ...filters, page, limit: 25 })}`, { keepPreviousData: true });

  if (readonly) return <><PageHeader title="Audit Log" /><Card><EmptyState title="Not available for read-only access" body="Regulators can access aggregated dashboards and reports." /></Card></>;

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Append-only, SHA-256 hash-chained record of every write and every access to student-level data."
        actions={
          <Button
            loading={checking}
            onClick={async () => {
              setChecking(true);
              try {
                setChain(await fetcher<Chain>("/api/v1/audit/verify-chain"));
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setChecking(false);
              }
            }}
          >
            <Link2 className="h-4 w-4" aria-hidden /> Verify Chain
          </Button>
        }
      />
      {chain && (
        <div role="status" className={chain.intact ? "mb-6 flex items-center gap-3 rounded border border-[#B9DDB1] bg-[#E7F4E4] px-5 py-4" : "mb-6 flex items-center gap-3 rounded border border-[#F3B9B9] bg-[#FDECEC] px-5 py-4"}>
          {chain.intact ? <CheckCircle2 className="h-7 w-7 text-success" aria-hidden /> : <XCircle className="h-7 w-7 text-danger" aria-hidden />}
          <div>
            <p className={chain.intact ? "text-lg font-semibold text-[#0E6106]" : "text-lg font-semibold text-[#9E1C1C]"}>{chain.intact ? "Chain intact ✓" : `Chain broken at entry #${chain.brokenAt}`}</p>
            <p className="text-sm text-muted">{chain.intact ? `${chain.checked.toLocaleString("en-IN")} entries verified end to end.` : chain.reason}</p>
          </div>
        </div>
      )}
      <Card>
        <form className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4" onSubmit={(e) => { e.preventDefault(); setFilters({ actor, action }); setPage(1); }}>
          <Field label="Actor" htmlFor="a-actor"><Input id="a-actor" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="email or system" /></Field>
          <Field label="Action starts with" htmlFor="a-action"><Input id="a-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="student. / consent. / ledger." /></Field>
          <Button type="submit" variant="secondary"><Search className="h-4 w-4" aria-hidden /> Filter</Button>
        </form>
        <ErrorNote error={error} />
        {isLoading ? <SkeletonRows rows={10} /> : !data?.items.length ? <EmptyState title="No audit entries" /> : (
          <>
            <Table caption="Audit log">
              <thead><tr>{["#", "When", "Actor", "Role", "Action", "Entity", "IP", "Hash (prev → this)"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e._id} className={chain && !chain.intact && chain.brokenAt === e.seq ? "flagged-row" : undefined}>
                    <td className="td">{e.seq}</td>
                    <td className="td whitespace-nowrap text-xs">{fmtDate(e.timestamp, true)}</td>
                    <td className="td text-xs">{e.actor}</td>
                    <td className="td text-xs">{e.role}</td>
                    <td className="td font-mono text-xs">{e.action}</td>
                    <td className="td text-xs">{e.entity}{e.entityId && <span className="block font-mono text-muted">{e.entityId.slice(0, 14)}</span>}</td>
                    <td className="td text-xs">{e.ip ?? "—"}</td>
                    <td className="td font-mono text-[11px] text-muted">{e.prevHash.slice(0, 8)} → {e.hash.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      <div className="mt-6"><TimeTravel /></div>
    </>
  );
}

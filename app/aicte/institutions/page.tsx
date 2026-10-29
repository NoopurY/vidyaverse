"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search } from "lucide-react";
import { Card, EmptyState, ErrorNote, Input, PageHeader, Pagination, Select, SkeletonRows, StatusBadge, Table, Tip } from "@/components/ui";
import { qs } from "@/lib/fetcher";
import { REGIONS, STATES } from "@/lib/constants";
import { fmtNum, fmtPct } from "@/lib/utils";

type Row = { id: string; aicteId: string; name: string; state: string; region: string; type: string; intake: number; enrolled: number; fillPct: number; openFlags: number; riskScore: number; riskReasons: string[]; badge: string; complianceScore: number };

export default function InstitutionsPage() {
  const [f, setF] = useState({ q: "", state: "", region: "", institutionType: "", badge: "", sort: "risk" });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useSWR<{ items: Row[]; total: number; page: number; limit: number }>(`/api/v1/institutions${qs({ ...f, page, limit: 20 })}`, { keepPreviousData: true });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setPage(1);
  };
  return (
    <>
      <PageHeader title="Institutions" description="AICTE-approved institutions in your scope with live intake, enrolment, compliance and risk." />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
          <form role="search" className="relative min-w-[220px] flex-1" onSubmit={(e) => { e.preventDefault(); setF((x) => ({ ...x, q })); setPage(1); }}>
            <label htmlFor="iq" className="sr-only">Search institutions</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="iq" className="pl-9" placeholder="Name, AICTE ID or district" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <Select aria-label="State" value={f.state} onChange={set("state")} className="w-40">
            <option value="">All states</option>
            {STATES.map((s) => <option key={s.code}>{s.name}</option>)}
          </Select>
          <Select aria-label="Region" value={f.region} onChange={set("region")} className="w-40">
            <option value="">All regions</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </Select>
          <Select aria-label="Type" value={f.institutionType} onChange={set("institutionType")} className="w-36">
            <option value="">All types</option>
            {["Government", "Private", "Deemed", "Autonomous"].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select aria-label="Badge" value={f.badge} onChange={set("badge")} className="w-40">
            <option value="">All badges</option>
            <option value="green">Compliant</option>
            <option value="amber">Needs Attention</option>
            <option value="red">Non-Compliant</option>
          </Select>
          <Select aria-label="Sort" value={f.sort} onChange={set("sort")} className="w-36">
            <option value="risk">Sort: risk</option>
            <option value="fill">Sort: fill %</option>
            <option value="name">Sort: name</option>
          </Select>
        </div>
        <ErrorNote error={error} />
        {isLoading ? (
          <SkeletonRows rows={8} />
        ) : !data?.items.length ? (
          <EmptyState title="No institutions match these filters" body="Clear a filter or search term to see more institutions." />
        ) : (
          <>
            <Table caption="Institutions">
              <thead>
                <tr>
                  {["Institution", "State", "Type", "Intake", "Enrolled", "Fill %", "Flags", "Risk", "Compliance", ""].map((h) => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className={r.riskScore >= 50 ? "flagged-row hover:bg-page" : "hover:bg-page"}>
                    <td className="td">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted">{r.aicteId}</p>
                    </td>
                    <td className="td">{r.state}</td>
                    <td className="td">{r.type}</td>
                    <td className="td">{fmtNum(r.intake)}</td>
                    <td className="td">{fmtNum(r.enrolled)}</td>
                    <td className="td">
                      <StatusBadge status={r.fillPct >= 100 ? "red" : r.fillPct >= 90 ? "amber" : "green"} label={fmtPct(r.fillPct)} />
                    </td>
                    <td className="td">{r.openFlags}</td>
                    <td className="td">
                      {r.riskReasons.length ? (
                        <Tip content={<ul className="list-disc pl-4">{r.riskReasons.slice(0, 4).map((x) => <li key={x}>{x}</li>)}</ul>}>
                          <span tabIndex={0} className={r.riskScore >= 50 ? "font-semibold text-danger" : "font-semibold"}>{r.riskScore}</span>
                        </Tip>
                      ) : (
                        <span className="font-semibold">{r.riskScore}</span>
                      )}
                    </td>
                    <td className="td"><StatusBadge status={r.badge} /></td>
                    <td className="td">
                      <Link href={`/aicte/institutions/${r.id}`} className="font-medium text-navy hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}

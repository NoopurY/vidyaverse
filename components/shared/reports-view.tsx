"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, FileText } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, ErrorNote, PageHeader, Select, SkeletonRows, Table } from "../ui";
import { qs } from "@/lib/fetcher";
import { DISCIPLINES, REGIONS, STATES } from "@/lib/constants";

const ALL = [
  ["state-enrolment", "State-wise enrolment", false],
  ["program-intake", "Program-wise intake vs enrolment", false],
  ["category-split", "Category split (NRI/OCI/FN/supernumerary/reserved)", false],
  ["flagged-institutions", "Flagged institutions with reasons", true],
  ["cross-duplicates", "Cross-institution duplicates", true],
  ["outcomes", "Outcomes (placement / higher studies)", false],
  ["accreditation", "Accreditation summary (NBA/NAAC style)", false],
  ["yoy-trends", "Year-on-year trends", false],
] as const;

type Report = { title: string; columns: { key: string; label: string }[]; rows: Record<string, unknown>[] };

/** Report picker + filters + preview table + CSV / PDF export (shared by AICTE and institutions) */
export function ReportsView({ aicte }: { aicte: boolean }) {
  const types = ALL.filter(([, , aicteOnly]) => aicte || !aicteOnly);
  const [type, setType] = useState<string>(types[0][0]);
  const [f, setF] = useState({ year: "2025-26", state: "", region: "", discipline: "", institutionType: "" });
  const query = qs(f);
  const { data, error, isLoading } = useSWR<Report>(`/api/v1/reports/${type}${query}`);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const href = (format: string) => `/api/v1/reports/${type}${query ? `${query}&` : "?"}format=${format}`;
  return (
    <>
      <PageHeader
        title="Reports"
        description="Preview, then export as CSV or PDF. Every export is recorded in the audit log."
        actions={
          <>
            <Button asChild variant="secondary"><a href={href("csv")}><Download className="h-4 w-4" aria-hidden /> CSV</a></Button>
            <Button asChild><a href={href("pdf")}><FileText className="h-4 w-4" aria-hidden /> PDF</a></Button>
          </>
        }
      />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
          <div className="min-w-[260px] flex-1">
            <label htmlFor="rtype" className="label">Report</label>
            <Select id="rtype" value={type} onChange={(e) => setType(e.target.value)}>
              {types.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </Select>
          </div>
          <Select aria-label="Academic year" value={f.year} onChange={set("year")} className="w-32"><option>2025-26</option><option>2024-25</option></Select>
          {aicte && (
            <>
              <Select aria-label="State" value={f.state} onChange={set("state")} className="w-40"><option value="">All states</option>{STATES.map((s) => <option key={s.code}>{s.name}</option>)}</Select>
              <Select aria-label="Region" value={f.region} onChange={set("region")} className="w-40"><option value="">All regions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</Select>
              <Select aria-label="Institution type" value={f.institutionType} onChange={set("institutionType")} className="w-36"><option value="">All types</option>{["Government", "Private", "Deemed", "Autonomous"].map((t) => <option key={t}>{t}</option>)}</Select>
            </>
          )}
          <Select aria-label="Program discipline" value={f.discipline} onChange={set("discipline")} className="w-36"><option value="">All programs</option>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</Select>
        </div>
        <CardHeader title={data?.title ?? "Report"} description={data ? `${data.rows.length} row(s)` : undefined} className="border-b-0" />
        <ErrorNote error={error} />
        {isLoading ? <SkeletonRows rows={8} /> : !data?.rows.length ? <EmptyState title="No data for these filters" /> : (
          <Table caption={data.title}>
            <thead><tr>{data.columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr></thead>
            <tbody>
              {data.rows.slice(0, 300).map((r, i) => (
                <tr key={i} className="hover:bg-page">{data.columns.map((c) => <td key={c.key} className="td">{String(r[c.key] ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge, Card, EmptyState, ErrorNote, PageHeader, SkeletonRows, StatusBadge, Table } from "@/components/ui";
import { api } from "@/lib/fetcher";
import { fmtNum, fmtPct } from "@/lib/utils";

type Resp = {
  engine: string;
  filter: Record<string, unknown>;
  items: { id: string; name: string; aicteId: string; state: string; type: string; intake: number; enrolled: number; fillPct: number; riskScore: number; badge: string; openFlags: number; topReason?: string }[];
};

const EXAMPLES = ["Show colleges in Maharashtra exceeding intake in CSE", "High-risk private institutions in Uttar Pradesh", "Institutions with ghost scholarship flags", "Non-compliant colleges in Karnataka"];

function Results() {
  const q = useSearchParams().get("q") ?? "";
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!q) return;
    setBusy(true);
    setError(null);
    api<Resp>("/api/v1/search", "POST", { query: q })
      .then(setData)
      .catch(setError)
      .finally(() => setBusy(false));
  }, [q]);
  return (
    <>
      <PageHeader title="Search" description={q ? `“${q}”` : "Ask a question in plain language using the search box above."} />
      {!q && (
        <Card className="p-5">
          <p className="text-sm font-semibold">Try:</p>
          <ul className="mt-2 space-y-1">
            {EXAMPLES.map((e) => <li key={e}><Link className="text-sm text-navy hover:underline" href={`/aicte/search?q=${encodeURIComponent(e)}`}>{e}</Link></li>)}
          </ul>
        </Card>
      )}
      <ErrorNote error={error} />
      {busy && <SkeletonRows rows={6} />}
      {data && !busy && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 text-sm">
            <Sparkles className="h-4 w-4 text-saffron" aria-hidden />
            <span className="text-muted">Understood as ({data.engine === "llm" ? "AI" : "keyword parser"}):</span>
            {Object.keys(data.filter).length ? Object.entries(data.filter).map(([k, v]) => <Badge key={k}>{k}: {String(v)}</Badge>) : <span className="text-muted">no filters (showing all)</span>}
          </div>
          {!data.items.length ? <EmptyState title="No institutions match" body="Try a broader question, or remove a condition." /> : (
            <Table caption="Search results">
              <thead><tr>{["Institution", "State", "Type", "Intake", "Enrolled", "Fill %", "Flags", "Risk", "Top reason", "Badge"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className={r.riskScore >= 50 ? "flagged-row hover:bg-page" : "hover:bg-page"}>
                    <td className="td"><Link href={`/aicte/institutions/${r.id}`} className="font-medium text-navy hover:underline">{r.name}</Link><span className="block text-xs text-muted">{r.aicteId}</span></td>
                    <td className="td">{r.state}</td>
                    <td className="td">{r.type}</td>
                    <td className="td">{fmtNum(r.intake)}</td>
                    <td className="td">{fmtNum(r.enrolled)}</td>
                    <td className="td">{fmtPct(r.fillPct)}</td>
                    <td className="td">{r.openFlags}</td>
                    <td className="td font-semibold">{r.riskScore}</td>
                    <td className="td text-xs text-muted">{r.topReason ?? "—"}</td>
                    <td className="td"><StatusBadge status={r.badge} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

export default function SearchPage() {
  return <Suspense><Results /></Suspense>;
}

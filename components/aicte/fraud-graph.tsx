"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { Building2, Phone, User, X } from "lucide-react";
import { Badge, EmptyState, Skeleton } from "../ui";

// The library's generic node/link types don't carry our fields, so the accessors are typed locally
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false, loading: () => <Skeleton className="h-[520px] w-full" /> }) as unknown as React.ComponentType<Record<string, any>>;

type GNode = { id: string; kind: "student" | "institution" | "contact"; label: string; suspicious: boolean; details: Record<string, unknown>; x?: number; y?: number };
type GLink = { source: string | GNode; target: string | GNode; kind: string; suspicious: boolean };
type Data = { nodes: GNode[]; links: GLink[]; summary: { contactClusters: number; multiInstitution: number; threshold: number } };

const COLORS = { institution: "#0B3D91", student: "#5F6B7A", contact: "#FF9933", red: "#C62828" };

/** Force-directed graph of students, institutions and masked shared contacts; suspicious clusters in red */
export function FraudGraph() {
  const { data, isLoading } = useSWR<Data>("/api/v1/fraud-graph");
  const [selected, setSelected] = useState<GNode | null>(null);
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const fg = useRef<{ zoomToFit: (ms?: number, px?: number) => void } | null>(null);
  // callback ref: the container only mounts after data loads
  useEffect(() => {
    if (!wrapEl) return;
    setWidth(wrapEl.clientWidth);
    const ro = new ResizeObserver(() => setWidth(wrapEl.clientWidth));
    ro.observe(wrapEl);
    return () => ro.disconnect();
  }, [wrapEl]);
  const graph = useMemo(() => (data ? { nodes: data.nodes.map((n) => ({ ...n })), links: data.links.map((l) => ({ ...l })) } : null), [data]);

  if (isLoading) return <Skeleton className="h-[520px] w-full" />;
  if (!graph?.nodes.length) return <EmptyState title="No suspicious links found" body="Shared contacts and multi-institution enrolments will appear here." />;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS.institution }} /> Institution</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS.student }} /> Student</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS.contact }} /> Shared contact (masked)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS.red }} /> Suspicious</span>
          <span className="ml-auto">
            {data!.summary.contactClusters} contact cluster(s) ≥ {data!.summary.threshold} · {data!.summary.multiInstitution} multi-institution student(s)
          </span>
        </div>
        <div ref={setWrapEl} className="h-[520px] overflow-hidden rounded border border-line bg-[#FBFCFD]" role="img" aria-label="Fraud graph. Use the list in the side panel for details.">
          {width > 0 && <ForceGraph2D
            ref={fg}
            onEngineStop={() => fg.current?.zoomToFit(400, 40)}
            graphData={graph}
            width={width}
            height={520}
            cooldownTicks={120}
            nodeRelSize={5}
            nodeVal={(n: GNode) => (n.kind === "institution" ? 6 : n.kind === "contact" ? 3 : 1.5)}
            nodeColor={(n: GNode) => (n.suspicious ? COLORS.red : COLORS[n.kind])}
            nodeLabel={(n: GNode) => n.label}
            linkColor={(l: GLink) => (l.suspicious ? "rgba(198,40,40,0.65)" : "rgba(95,107,122,0.25)")}
            linkWidth={(l: GLink) => (l.suspicious ? 1.8 : 0.8)}
            linkLineDash={(l: GLink) => (l.kind === "same-person" ? [4, 3] : null)}
            onNodeClick={(n: GNode) => setSelected(n)}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(n: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
              if (n.kind !== "institution" && !(n.kind === "contact" && n.suspicious)) return;
              const fs = 11 / scale;
              ctx.font = `${fs}px sans-serif`;
              ctx.fillStyle = "#1A1A1A";
              ctx.textAlign = "center";
              ctx.fillText(n.label.length > 28 ? n.label.slice(0, 26) + "…" : n.label, n.x ?? 0, (n.y ?? 0) + 12 / scale + 6);
            }}
          />}
        </div>
      </div>
      <aside className="rounded border border-line bg-white p-4" aria-live="polite">
        {!selected ? (
          <div className="text-sm text-muted">
            <p className="font-semibold text-ink">Node details</p>
            <p className="mt-1">Click a node to see details and linked alerts.</p>
            <p className="mt-4 font-semibold text-ink">Suspicious nodes</p>
            <ul className="mt-2 max-h-[400px] space-y-1 overflow-y-auto">
              {graph.nodes
                .filter((n) => n.suspicious && n.kind !== "student")
                .map((n) => (
                  <li key={n.id}>
                    <button className="w-full rounded px-2 py-1 text-left text-xs hover:bg-navy-tint" onClick={() => setSelected(n)}>
                      {n.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {selected.kind === "institution" ? <Building2 className="h-5 w-5 text-navy" /> : selected.kind === "contact" ? <Phone className="h-5 w-5 text-saffron" /> : <User className="h-5 w-5 text-muted" />}
                <p className="font-semibold">{selected.label}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close details" className="rounded p-1 hover:bg-page">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2">{selected.suspicious ? <Badge tone="red">Suspicious</Badge> : <Badge tone="grey">No direct signal</Badge>}</div>
            <dl className="mt-3 space-y-2 text-sm">
              {Object.entries(selected.details)
                .filter(([k, v]) => v !== undefined && !["flags", "alerts", "institutionId", "studentId"].includes(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="break-all">{String(v)}</dd>
                  </div>
                ))}
            </dl>
            {Array.isArray(selected.details.flags) && (selected.details.flags as string[]).length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase text-muted">Flags</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">{(selected.details.flags as string[]).map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            )}
            {Array.isArray(selected.details.alerts) && (selected.details.alerts as string[]).length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase text-muted">Linked alerts</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">{(selected.details.alerts as string[]).map((f, i) => <li key={i}>{f}</li>)}</ul>
              </>
            )}
            {typeof selected.details.institutionId === "string" && (
              <Link href={`/aicte/institutions/${selected.details.institutionId}`} className="mt-4 inline-block text-sm font-medium text-navy hover:underline">
                Open institution →
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

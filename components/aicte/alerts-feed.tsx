"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button, EmptyState, SeverityBadge, SkeletonRows, StatusBadge } from "../ui";
import { api } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

export type AlertRow = { _id: string; type: string; severity: string; message: string; status: string; createdAt: string; channelsSent?: string[] };

/** Live alerts (SWR polling every 10 seconds) with acknowledge / resolve */
export function AlertsFeed({ limit = 8, compact, canAct = true, query = "" }: { limit?: number; compact?: boolean; canAct?: boolean; query?: string }) {
  const { data, isLoading, mutate } = useSWR<{ items: AlertRow[] }>(`/api/v1/alerts?limit=${limit}${query}`, { refreshInterval: 10_000 });
  const act = async (id: string, action: "acknowledge" | "resolve") => {
    try {
      await api(`/api/v1/alerts/${id}`, "PATCH", { action });
      toast.success(action === "acknowledge" ? "Alert acknowledged" : "Alert resolved");
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  if (isLoading) return <SkeletonRows rows={4} />;
  if (!data?.items.length) return <EmptyState title="No alerts" body="Intake breaches, ghost-student and double-enrolment alerts appear here in real time." />;
  return (
    <ul className={compact ? "max-h-[460px] divide-y divide-line overflow-y-auto" : "divide-y divide-line"} aria-live="polite">
      {data.items.map((a) => (
        <li key={a._id} className="px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={a.severity} />
            <StatusBadge status={a.status} />
            {a.channelsSent?.includes("whatsapp") && (
              <span className="inline-flex items-center gap-1 text-[11px] text-success">
                <MessageCircle className="h-3 w-3" aria-hidden /> WhatsApp sent
              </span>
            )}
            <span className="ml-auto text-[11px] text-muted">{fmtDate(a.createdAt, true)}</span>
          </div>
          <p className="mt-1.5 text-sm">{a.message}</p>
          {canAct && a.status !== "resolved" && (
            <div className="mt-2 flex gap-2">
              {a.status === "open" && (
                <Button size="sm" variant="secondary" onClick={() => act(a._id, "acknowledge")}>
                  Acknowledge
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => act(a._id, "resolve")}>
                Resolve
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

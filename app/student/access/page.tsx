"use client";

import useSWR from "swr";
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, SkeletonRows, Table } from "@/components/ui";
import type { MeResponse } from "@/components/student/types";
import { fmtDate } from "@/lib/utils";

const ACTION_TEXT: Record<string, string> = {
  "student.pii_read": "Viewed your full record",
  "student.history_read": "Viewed your record history",
  "verification.consented_read": "Verified your record with your consent",
  "certificate.data_read": "Fetched certificate data",
  "student.update": "Updated your record",
  "student.enrol": "Created your record",
};

export default function AccessLog() {
  const { data, error, isLoading } = useSWR<MeResponse>("/api/v1/me");
  if (isLoading) return <SkeletonRows rows={8} />;
  if (error || !data) return <ErrorNote error={error} />;
  return (
    <>
      <PageHeader title="Access Log" description="Your data rights: see who accessed or verified your record, when, and how; and every change made to it." />
      <Card>
        <CardHeader title="Who accessed my data" />
        {!data.accessLog.length ? <EmptyState title="No access recorded yet" /> : (
          <Table caption="Access history">
            <thead><tr>{["When", "Who", "What", "Channel", "Consent"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {data.accessLog.map((a, i) => (
                <tr key={i}>
                  <td className="td whitespace-nowrap">{fmtDate(a.at, true)}</td>
                  <td className="td">{a.who}</td>
                  <td className="td">{ACTION_TEXT[a.what] ?? a.what}</td>
                  <td className="td capitalize">{a.channel}</td>
                  <td className="td font-mono text-xs">{a.consentId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card className="mt-6">
        <CardHeader title="Changes to my record" description="Every version is kept (time-travel history)" />
        <Table caption="Record versions">
          <thead><tr>{["Version", "When", "By", "What changed"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {[...data.history].reverse().map((h) => (
              <tr key={h.version}>
                <td className="td">v{h.version}</td>
                <td className="td whitespace-nowrap">{fmtDate(h.changedAt, true)}</td>
                <td className="td">{h.changedBy}</td>
                <td className="td text-xs">{Object.keys(h.diff).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

"use client";

import useSWR from "swr";
<<<<<<< HEAD
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, SkeletonRows, Table } from "@/components/ui";
=======
import { History, Lock, ShieldCheck, UserCheck } from "lucide-react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorNote,
  PageHeader,
  SkeletonRows,
  Table,
} from "@/components/ui";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import type { MeResponse } from "@/components/student/types";
import { fmtDate } from "@/lib/utils";

const ACTION_TEXT: Record<string, string> = {
<<<<<<< HEAD
  "student.pii_read": "Viewed your full record",
  "student.history_read": "Viewed your record history",
  "verification.consented_read": "Verified your record with your consent",
  "certificate.data_read": "Fetched certificate data",
  "student.update": "Updated your record",
  "student.enrol": "Created your record",
=======
  "student.pii_read": "Viewed full student record",
  "student.history_read": "Viewed record revision history",
  "verification.consented_read": "Verified credential with authorized consent",
  "certificate.data_read": "Retrieved digital certificate payload",
  "student.update": "Record updated by institution",
  "student.enrol": "Initial enrollment recorded",
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
};

export default function AccessLog() {
  const { data, error, isLoading } = useSWR<MeResponse>("/api/v1/me");
<<<<<<< HEAD
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
=======

  if (isLoading) return <SkeletonRows rows={8} />;
  if (error || !data) return <ErrorNote error={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Log & Data Rights Audit"
        description="Under the DPDP Act 2023, you have the right to know who accessed your data, when, under what authorization, and every revision made to your official record."
      />

      {/* Access Event History */}
      <Card>
        <CardHeader
          title="Data Disclosures & Access Events"
          description="Every access to your personal or academic information is recorded in a tamper-proof audit trail."
        />
        {!data.accessLog.length ? (
          <EmptyState
            title="No data accesses recorded yet"
            body="When an employer or academic institution verifies your credentials, the timestamp, requester name, and consent code will appear here."
          />
        ) : (
          <Table caption="Student data access log">
            <thead>
              <tr>
                {["Timestamp", "Accessing Entity", "Action Performed", "Channel", "Consent Reference"].map(
                  (h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.accessLog.map((a, i) => (
                <tr key={i} className="hover:bg-page transition-colors">
                  <td className="td whitespace-nowrap text-xs text-muted font-mono">
                    {fmtDate(a.at, true)}
                  </td>
                  <td className="td font-semibold text-ink text-xs">{a.who}</td>
                  <td className="td text-xs text-ink">{ACTION_TEXT[a.what] ?? a.what}</td>
                  <td className="td">
                    <span className="rounded bg-navy-light px-2 py-0.5 text-[10.5px] font-semibold text-navy uppercase">
                      {a.channel}
                    </span>
                  </td>
                  <td className="td font-mono text-xs text-muted">
                    {a.consentId ? (
                      <span className="font-semibold text-ink">{a.consentId}</span>
                    ) : (
                      "—"
                    )}
                  </td>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
<<<<<<< HEAD
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
=======

      {/* Time-Travel Record Revision History */}
      <Card>
        <CardHeader
          title="Record Revision History (Time-Travel)"
          description="Every update made by your institution is versioned and cryptographically preserved."
        />
        <Table caption="Record versions and revisions">
          <thead>
            <tr>
              {["Version", "Date Modified", "Modified By", "Changed Fields"].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data.history].reverse().map((h) => (
              <tr key={h.version} className="hover:bg-page transition-colors">
                <td className="td">
                  <Badge tone="navy">v{h.version}</Badge>
                </td>
                <td className="td whitespace-nowrap text-xs text-muted font-mono">
                  {fmtDate(h.changedAt, true)}
                </td>
                <td className="td font-medium text-xs text-ink">{h.changedBy}</td>
                <td className="td text-xs text-muted">
                  {Object.keys(h.diff).length ? (
                    <span className="font-mono text-ink font-medium">
                      {Object.keys(h.diff).join(", ")}
                    </span>
                  ) : (
                    "Initial record creation"
                  )}
                </td>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
<<<<<<< HEAD
    </>
=======
    </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

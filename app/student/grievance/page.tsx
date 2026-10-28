"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Table } from "@/components/ui";
import { api } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type G = { _id: string; field: string; currentValue?: string; requestedValue: string; reason: string; status: string; remarks?: string; createdAt: string };

const STATUS_TEXT: Record<string, string> = { open: "Open", "institution-fixed": "Fixed by institution", "aicte-approved": "Approved by AICTE", rejected: "Rejected" };

export default function Grievance() {
  const { data, mutate } = useSWR<{ items: G[] }>("/api/v1/grievances");
  const [f, setF] = useState({ field: "name", currentValue: "", requestedValue: "", reason: "" });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeader title="Grievance – request a correction" description="If any detail in your record is wrong, request a correction. Your institution fixes it and AICTE approves." />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader title="New request" />
          <CardBody>
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api("/api/v1/grievances", "POST", f);
                  toast.success("Correction request sent to your institution");
                  setF({ field: "name", currentValue: "", requestedValue: "", reason: "" });
                  mutate();
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Which detail?" htmlFor="g-field">
                <Select id="g-field" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })}>
                  {[["name", "Name"], ["dob", "Date of birth"], ["gender", "Gender"], ["category", "Category"], ["programId", "Program"], ["admissionDate", "Admission date"], ["status", "Status"], ["phone", "Mobile"], ["email", "Email"], ["parentName", "Parent name"], ["other", "Other"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Current value (as shown)" htmlFor="g-cur"><Input id="g-cur" value={f.currentValue} onChange={(e) => setF({ ...f, currentValue: e.target.value })} /></Field>
              <Field label="Correct value" htmlFor="g-new"><Input id="g-new" required value={f.requestedValue} onChange={(e) => setF({ ...f, requestedValue: e.target.value })} /></Field>
              <Field label="Reason / supporting document" htmlFor="g-reason"><textarea id="g-reason" required minLength={5} rows={3} className="input h-auto py-2" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Spelling as per 10th marksheet" /></Field>
              <Button type="submit" size="lg" loading={busy}>Submit request</Button>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="My requests" />
          {!data?.items.length ? <EmptyState title="No requests yet" /> : (
            <Table caption="My correction requests">
              <thead><tr>{["Raised", "Field", "Requested", "Status", "Remarks"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((g) => (
                  <tr key={g._id}>
                    <td className="td whitespace-nowrap">{fmtDate(g.createdAt)}</td>
                    <td className="td">{g.field}</td>
                    <td className="td font-medium">{g.requestedValue}</td>
                    <td className="td"><StatusBadge status={g.status} label={STATUS_TEXT[g.status]} /></td>
                    <td className="td text-xs text-muted">{g.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, SkeletonRows, StatusBadge, Table } from "@/components/ui";
import type { InstitutionDetail } from "@/components/shared/types";
import { api } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type T = { id: string; direction: string; apaarId: string; studentName: string; from: string; to: string; toProgramId: string; status: string; reason?: string; requestedAt: string; releasedAt?: string; completedAt?: string };

export default function TransfersPage() {
  const { data: session } = useSession();
  const { data: inst } = useSWR<InstitutionDetail>(session?.user?.institutionId ? `/api/v1/institutions/${session.user.institutionId}` : null);
  const { data, isLoading, mutate } = useSWR<{ items: T[] }>("/api/v1/transfers");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ apaarId: "", studentName: "", toProgramId: "", academicYear: "2025-26", reason: "" });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ t: T; action: "release" | "complete" | "reject" } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const COPY = {
    release: ["Release this student?", "The student is marked 'transferred' here and the seat token is released. The new institution can then complete the transfer."],
    complete: ["Complete the transfer?", "The student is enrolled at your institution and consumes one of your seat tokens."],
    reject: ["Reject this transfer?", "The request will be closed. Both institutions and the student are notified."],
  } as const;

  return (
    <>
      <PageHeader
        title="Transfers"
        description="New institution requests → current institution releases (seat freed) → new institution completes (seat consumed). A second active enrolment is blocked until release."
        actions={<Button onClick={() => setOpen(true)}><ArrowLeftRight className="h-4 w-4" aria-hidden /> Request transfer</Button>}
      />
      <Card>
        <CardHeader title="Incoming and outgoing transfers" />
        {isLoading ? <SkeletonRows /> : !data?.items.length ? <EmptyState title="No transfers" body="Request a transfer when a student enrolled elsewhere joins your institution." /> : (
          <Table caption="Transfers">
            <thead><tr>{["Direction", "Student", "APAAR", "From", "To", "Program", "Status", "Requested", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id}>
                  <td className="td capitalize">{t.direction}</td>
                  <td className="td font-medium">{t.studentName}</td>
                  <td className="td font-mono text-xs">{t.apaarId}</td>
                  <td className="td text-xs">{t.from}</td>
                  <td className="td text-xs">{t.to}</td>
                  <td className="td">{t.toProgramId}</td>
                  <td className="td"><StatusBadge status={t.status} /></td>
                  <td className="td whitespace-nowrap text-xs">{fmtDate(t.requestedAt)}</td>
                  <td className="td whitespace-nowrap">
                    {t.direction === "outgoing" && t.status === "requested" && (
                      <>
                        <Button size="sm" onClick={() => setConfirm({ t, action: "release" })}>Release</Button>{" "}
                        <Button size="sm" variant="ghost" onClick={() => setConfirm({ t, action: "reject" })}>Reject</Button>
                      </>
                    )}
                    {t.direction === "incoming" && t.status === "released" && <Button size="sm" variant="success" onClick={() => setConfirm({ t, action: "complete" })}>Complete</Button>}
                    {t.direction === "incoming" && t.status === "requested" && <span className="text-xs text-muted">Awaiting release</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="Request a transfer" description="The current institution is not revealed to you; it receives your request and the student is notified.">
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await api<{ message: string }>("/api/v1/transfers", "POST", f);
              toast.success(r.message);
              setOpen(false);
              mutate();
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Student APAAR ID" htmlFor="t-apaar"><Input id="t-apaar" required pattern="\d{12}" maxLength={12} value={f.apaarId} onChange={set("apaarId")} /></Field>
          <Field label="Student name" htmlFor="t-name"><Input id="t-name" required value={f.studentName} onChange={set("studentName")} /></Field>
          <Field label="Program at your institution" htmlFor="t-prog">
            <Select id="t-prog" required value={f.toProgramId} onChange={set("toProgramId")}>
              <option value="">Select</option>
              {inst?.institution.programs.map((p) => <option key={p.programId} value={p.programId}>{p.programId} – {p.name}</option>)}
            </Select>
          </Field>
          <Field label="Academic year" htmlFor="t-year"><Select id="t-year" value={f.academicYear} onChange={set("academicYear")}><option>2025-26</option><option>2024-25</option></Select></Field>
          <Field label="Reason" htmlFor="t-reason"><Input id="t-reason" value={f.reason} onChange={set("reason")} placeholder="e.g. Migration on parent's job transfer" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={busy}>Send request</Button></div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? COPY[confirm.action][0] : ""}
        body={confirm ? COPY[confirm.action][1] : ""}
        confirmLabel={confirm?.action === "release" ? "Release" : confirm?.action === "complete" ? "Complete" : "Reject"}
        danger={confirm?.action === "reject"}
        onConfirm={async () => {
          try {
            await api(`/api/v1/transfers/${confirm!.t.id}`, "PATCH", { action: confirm!.action });
            toast.success(`Transfer ${confirm!.action === "release" ? "released" : confirm!.action === "complete" ? "completed" : "rejected"}`);
            mutate();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Award, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, ConfirmDialog, ErrorNote, Field, Input, PageHeader, Select, SkeletonRows, StatusBadge, Tab, TabPanel, Table, Tabs, TabsList } from "@/components/ui";
import { IssuesTable } from "@/components/shared/issues-table";
import type { IssueRow } from "@/components/shared/types";
import { api, fetcher, FetchError } from "@/lib/fetcher";
import { fmtDate } from "@/lib/utils";

type Detail = {
  student: { id: string; apaarId: string; institutionStudentId?: string; name: string; dob: string; gender: string; category: string; nationalityStatus: string; seatType: string; programId: string; academicYear: string; admissionDate: string; counsellingRef?: string; status: string; phone?: string; email?: string; parentName?: string; version: number; outcome?: { type: string; organisation?: string; year?: number; consentGiven?: boolean } };
  history: { version: number; changedBy: string; changedAt: string; diff: Record<string, unknown> }[];
  issues: IssueRow[];
  credentials: { credentialId: string; issuedAt: string; revoked: boolean }[];
};

export default function StudentDetail({ params }: { params: { apaar: string } }) {
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR<Detail>(`/api/v1/students/${params.apaar}`);
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [asOf, setAsOf] = useState("");
  const [snap, setSnap] = useState<Record<string, unknown> | null>(null);
  const [cert, setCert] = useState<{ institutionStudentId?: string; credentialId: string; verifyUrl: string } | null>(null);
  useEffect(() => {
    if (data) {
      const s = data.student;
      setForm({ name: s.name, programId: s.programId, seatType: s.seatType, status: s.status, counsellingRef: s.counsellingRef ?? "", phone: s.phone ?? "", email: s.email ?? "", institutionStudentId: s.institutionStudentId ?? "" });
    }
  }, [data]);
  if (isLoading) return <SkeletonRows rows={10} />;
  if (error || !data) return <ErrorNote error={error} />;
  const s = data.student;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== "" && v !== (s as Record<string, unknown>)[k]));
  const releasing = changed.status === "dropped";

  const save = async () => {
    try {
      const r = await api<{ version: number; changed: boolean }>(`/api/v1/students/${s.apaarId}`, "PUT", { ...changed, expectedVersion: s.version }, { "Idempotency-Key": crypto.randomUUID() });
      toast.success(r.changed ? `Saved as version ${r.version}. Previously issued credentials were revoked.` : "No changes");
      mutate();
    } catch (e) {
      const fe = e as FetchError;
      const issues = (fe.details as { issues?: { message: string; fixHint: string }[] })?.issues;
      toast.error(fe.message, { description: issues?.map((i) => `${i.message}. ${i.fixHint}`).join(" ") });
    }
  };

  return (
    <>
      <PageHeader
        title={s.name}
        description={`APAAR ${s.apaarId} · ${s.programId} · ${s.academicYear} · version ${s.version}`}
        actions={
          <>
            <StatusBadge status={s.status} />
            <Button asChild variant="secondary"><a href={`/api/v1/credentials/${s.apaarId}/pdf`}><Download className="h-4 w-4" aria-hidden /> Signed record (PDF)</a></Button>
            {session?.user?.isDegreeAwarding && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    setCert(await fetcher(`/api/v1/certificate-data/${s.apaarId}`));
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                <Award className="h-4 w-4" aria-hidden /> Certificate data
              </Button>
            )}
          </>
        }
      />
      {cert && (
        <Card className="mb-6 p-5 text-sm">
          <p className="font-semibold">Certificate data (degree-awarding institution)</p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-3">
            <div><dt className="text-xs text-muted">APAAR</dt><dd className="font-mono">{s.apaarId}</dd></div>
            <div><dt className="text-xs text-muted">Institution student ID</dt><dd className="font-mono">{cert.institutionStudentId ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted">Credential</dt><dd className="font-mono text-xs">{cert.credentialId}</dd></div>
          </dl>
          <p className="mt-2 break-all text-xs text-muted">QR verification URL: {cert.verifyUrl.slice(0, 120)}…</p>
          <Button asChild className="mt-3" size="sm"><a href={`/api/v1/certificate-data/${s.apaarId}?format=pdf`} target="_blank" rel="noreferrer">Preview sample certificate (PDF)</a></Button>
        </Card>
      )}
      <Tabs defaultValue="edit">
        <TabsList>
          <Tab value="edit">Record</Tab>
          <Tab value="issues">Issues ({data.issues.filter((i) => i.status === "open").length})</Tab>
          <Tab value="history">History & time travel</Tab>
        </TabsList>
        <TabPanel value="edit">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader title="Edit record" description="Changes are versioned, re-validated and audited. Dropping a student releases the seat token." />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="e-name"><Input id="e-name" value={form.name ?? ""} onChange={set("name")} /></Field>
                <Field label="Institution student ID" htmlFor="e-isid"><Input id="e-isid" value={form.institutionStudentId ?? ""} onChange={set("institutionStudentId")} /></Field>
                <Field label="Program ID" htmlFor="e-prog"><Input id="e-prog" value={form.programId ?? ""} onChange={set("programId")} /></Field>
                <Field label="Seat type" htmlFor="e-seat">
                  <Select id="e-seat" value={form.seatType} onChange={set("seatType")}>{["regular", "nri", "oci", "fn", "tfw", "other"].map((x) => <option key={x}>{x}</option>)}</Select>
                </Field>
                <Field label="Status" htmlFor="e-status" hint="To move a student to another institution, use Transfers.">
                  <Select id="e-status" value={form.status} onChange={set("status")}>{["active", "dropped", "graduated"].map((x) => <option key={x}>{x}</option>)}{s.status === "transferred" && <option>transferred</option>}</Select>
                </Field>
                <Field label="Counselling reference" htmlFor="e-cref"><Input id="e-cref" value={form.counsellingRef ?? ""} onChange={set("counsellingRef")} /></Field>
                <Field label="Mobile" htmlFor="e-phone"><Input id="e-phone" value={form.phone ?? ""} onChange={set("phone")} /></Field>
                <Field label="Email" htmlFor="e-email"><Input id="e-email" value={form.email ?? ""} onChange={set("email")} /></Field>
                <div className="flex justify-end sm:col-span-2">
                  <Button disabled={!Object.keys(changed).length} onClick={() => (releasing ? setConfirm(true) : save())}><Save className="h-4 w-4" aria-hidden /> Save changes</Button>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Details" />
              <CardBody>
                <dl className="space-y-2 text-sm">
                  {[["Date of birth", s.dob], ["Gender", s.gender], ["Category", s.category], ["Nationality", s.nationalityStatus], ["Admission date", s.admissionDate], ["Parent/guardian", s.parentName ?? "—"], ["Outcome", s.outcome?.type && s.outcome.type !== "none" ? `${s.outcome.type} – ${s.outcome.organisation} (${s.outcome.year})` : "—"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-dashed border-line pb-1"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
                  ))}
                </dl>
                <p className="mt-4 text-xs font-semibold uppercase text-muted">Credentials</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {data.credentials.length ? data.credentials.map((c) => <li key={c.credentialId} className="flex justify-between"><span className="font-mono">{c.credentialId.slice(0, 13)}…</span><StatusBadge status={c.revoked ? "revoked" : "active"} label={c.revoked ? "Revoked" : "Valid"} /></li>) : <li className="text-muted">None issued yet</li>}
                </ul>
              </CardBody>
            </Card>
          </div>
        </TabPanel>
        <TabPanel value="issues">
          <Card><IssuesTable items={data.issues.filter((i) => i.status === "open")} canResolve onChange={() => mutate()} /></Card>
        </TabPanel>
        <TabPanel value="history">
          <Card>
            <CardHeader
              title="Version history"
              action={
                <form className="flex items-end gap-2" onSubmit={async (e) => { e.preventDefault(); try { const r = await fetcher<{ records: { institutionId: string; asOf: { snapshot: Record<string, unknown> } | null }[] }>(`/api/v1/students/${s.apaarId}/history?asOf=${asOf}`); setSnap(r.records[0]?.asOf?.snapshot ?? {}); } catch (err) { toast.error((err as Error).message); } }}>
                  <Field label="View as of" htmlFor="asof"><Input id="asof" type="date" required value={asOf} onChange={(e) => setAsOf(e.target.value)} /></Field>
                  <Button type="submit" variant="secondary">Go</Button>
                </form>
              }
            />
            {snap && (
              <div className="border-b border-line bg-page px-5 py-3 text-xs">
                {Object.keys(snap).length ? <span className="font-mono">{JSON.stringify(snap)}</span> : "No version existed on that date."}
              </div>
            )}
            <Table caption="Version history">
              <thead><tr>{["Version", "When", "By", "Changes"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {[...data.history].reverse().map((h) => (
                  <tr key={h.version}>
                    <td className="td">v{h.version}</td>
                    <td className="td whitespace-nowrap">{fmtDate(h.changedAt, true)}</td>
                    <td className="td">{h.changedBy}</td>
                    <td className="td font-mono text-xs">{JSON.stringify(h.diff)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </TabPanel>
      </Tabs>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Mark student as dropped?" body="The student's seat token will be released and any issued credentials revoked. This is recorded in the audit log." confirmLabel="Drop student" danger onConfirm={save} />
    </>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { Copy, Download, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, Dialog, ErrorNote, Field, Input, PageHeader, Select, Skeleton, SkeletonRows, StatusBadge } from "@/components/ui";
import { ConsentNotice } from "@/components/student/consent-notice";
import type { MeResponse } from "@/components/student/types";
import { api } from "@/lib/fetcher";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

const STATUS_TEXT: Record<string, string> = { active: "Enrolled", graduated: "Graduated", dropped: "Discontinued", transferred: "Transferred out" };

export default function MyRecord() {
  const { data, error, isLoading } = useSWR<MeResponse>("/api/v1/me");
  const apaar = data?.record.apaarId;
  const { data: qr } = useSWR<{ qr: string; credentialId: string; url: string }>(apaar ? `/api/v1/credentials/${apaar}/qr` : null);
  const [share, setShare] = useState(false);
  const [fields, setFields] = useState<string[]>(["name", "institution", "program", "academicYear", "status"]);
  const [purpose, setPurpose] = useState("employment");
  const [requester, setRequester] = useState("");
  const [days, setDays] = useState(7);
  const [accepted, setAccepted] = useState(false);
  const [link, setLink] = useState<{ link: string; code: string; consentId: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <SkeletonRows rows={8} />;
  if (error || !data) return <ErrorNote error={error} />;
  const r = data.record;

  return (
    <>
      <PageHeader title="My Record" description="Your verified academic record held by AICTE, linked to your APAAR ID." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
        {/* Digital ID card */}
        <Card className="overflow-hidden">
          <div className="flex h-1.5" aria-hidden><div className="flex-1 bg-saffron" /><div className="flex-1 bg-white" /><div className="flex-1 bg-indgreen" /></div>
          <div className="bg-navy px-5 py-3 text-white">
            <p className="text-xs uppercase tracking-wider text-white/80">AICTE · Digital Student ID</p>
            <p className="text-sm font-semibold">{r.institution}</p>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-muted">Name</dt><dd className="text-lg font-semibold">{r.name}</dd></div>
              <div><dt className="text-xs text-muted">APAAR ID</dt><dd className="font-mono font-semibold tracking-wider">{r.apaarId}</dd></div>
              <div><dt className="text-xs text-muted">Program</dt><dd className="font-medium">{r.programName} ({r.programLevel})</dd></div>
              <div><dt className="text-xs text-muted">Academic year</dt><dd>{r.academicYear}</dd></div>
              <div><dt className="text-xs text-muted">Status</dt><dd><StatusBadge status={r.status} label={STATUS_TEXT[r.status] ?? r.status} /></dd></div>
            </dl>
            <div className="flex flex-col items-center">
              {/* data: URL generated server-side; next/image adds nothing here */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qr ? <img src={qr.qr} alt="QR code to verify this record" className="h-36 w-36 rounded border border-line" /> : <Skeleton className="h-36 w-36" />}
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-success"><ShieldCheck className="h-3 w-3" aria-hidden /> Signed by AICTE</span>
              {qr && (
                <span className="mt-1 max-w-[9.5rem] text-center text-[10px] leading-tight text-muted" title={qr.credentialId}>
                  W3C credential
                  <span className="block font-mono text-ink">{qr.credentialId.slice(0, 8)}…{qr.credentialId.slice(-4)}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line p-4">
            <Button asChild size="lg" className="flex-1"><a href={`/api/v1/credentials/${r.apaarId}/pdf`}><Download className="h-4 w-4" aria-hidden /> Download signed record (PDF)</a></Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => { setShare(true); setLink(null); setAccepted(false); }}><Share2 className="h-4 w-4" aria-hidden /> Share verification link</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Record details" description={`Version ${r.version} · held by AICTE`} />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[["Date of birth", r.dob], ["Gender", r.gender], ["Category", r.category], ["Nationality", r.nationalityStatus], ["Admission date", fmtDate(r.admissionDate)], ["Institution student ID", r.institutionStudentId ?? "—"], ["Mobile", r.phone ?? "—"], ["Email", r.email ?? "—"], ["Parent / guardian", r.parentName ?? "—"], ["State", r.state ?? "—"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-dashed border-line pb-1"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted">Something wrong? Raise a correction request on the Grievance page.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Consent at a glance" />
            <CardBody className="flex gap-6 text-sm">
              <p><span className="text-2xl font-semibold text-[#7A5A00]">{data.consentSummary.pending}</span><br />pending requests</p>
              <p><span className="text-2xl font-semibold text-success">{data.consentSummary.active}</span><br />active consents</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog open={share} onOpenChange={setShare} title="Share a verification link" description="Creates an approved consent with a 6-digit code. Anyone with the link can verify only the fields you choose, until it expires.">
        {link ? (
          <div className="space-y-3">
            <p className="text-sm">Consent <b>{link.consentId}</b> · code <b className="font-mono text-lg">{link.code}</b> · valid till {fmtDate(link.expiresAt)}</p>
            <div className="flex gap-2">
              <Input readOnly value={link.link} aria-label="Verification link" />
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(link.link).then(() => toast.success("Link copied"))} aria-label="Copy link"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted">You can revoke it any time from the Consent page.</p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                setLink(await api("/api/v1/consent/share", "POST", { requesterName: requester || "Anyone with this link", purpose, fieldsAllowed: fields, validDays: days, noticeAccepted: accepted }));
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Shared with (optional)" htmlFor="sh-req"><Input id="sh-req" value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="e.g. Infosys HR" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purpose" htmlFor="sh-purpose"><Select id="sh-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}><option value="employment">Employment</option><option value="higher-studies">Higher studies</option><option value="other">Other</option></Select></Field>
              <Field label="Valid for (days)" htmlFor="sh-days"><Input id="sh-days" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
            </div>
            <fieldset>
              <legend className="label">Fields to disclose</legend>
              <div className="flex flex-wrap gap-3">
                {["name", "institution", "program", "academicYear", "status", "dob", "apaarId", "outcome"].map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-navy" checked={fields.includes(f)} onChange={(e) => setFields((x) => (e.target.checked ? [...x, f] : x.filter((y) => y !== f)))} />{FIELD_LABEL[f]}</label>
                ))}
              </div>
            </fieldset>
            <ConsentNotice />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> I have read the notice and consent to this sharing / मैंने सूचना पढ़ ली है और सहमति देता/देती हूँ</label>
            <div className="flex justify-end"><Button type="submit" loading={busy} disabled={!accepted || !fields.length}>Create link</Button></div>
          </form>
        )}
      </Dialog>
    </>
  );
}

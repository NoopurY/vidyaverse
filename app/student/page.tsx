"use client";

import { useState } from "react";
<<<<<<< HEAD
import useSWR from "swr";
import { Copy, Download, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, Dialog, ErrorNote, Field, Input, PageHeader, Select, Skeleton, SkeletonRows, StatusBadge } from "@/components/ui";
=======
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Fingerprint,
  History,
  Lock,
  QrCode,
  Share2,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  ErrorNote,
  Field,
  Input,
  Select,
  Skeleton,
  SkeletonRows,
  StatusBadge,
} from "@/components/ui";
import { WelcomeHero } from "@/components/welcome-hero";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { ConsentNotice } from "@/components/student/consent-notice";
import type { MeResponse } from "@/components/student/types";
import { api } from "@/lib/fetcher";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

<<<<<<< HEAD
const STATUS_TEXT: Record<string, string> = { active: "Enrolled", graduated: "Graduated", dropped: "Discontinued", transferred: "Transferred out" };
=======
const STATUS_TEXT: Record<string, string> = {
  active: "Enrolled & Active",
  graduated: "Graduated",
  dropped: "Discontinued",
  transferred: "Transferred Out",
};
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020

export default function MyRecord() {
  const { data, error, isLoading } = useSWR<MeResponse>("/api/v1/me");
  const apaar = data?.record.apaarId;
<<<<<<< HEAD
  const { data: qr } = useSWR<{ qr: string; credentialId: string; url: string }>(apaar ? `/api/v1/credentials/${apaar}/qr` : null);
  const [share, setShare] = useState(false);
  const [fields, setFields] = useState<string[]>(["name", "institution", "program", "academicYear", "status"]);
=======
  const { data: qr } = useSWR<{ qr: string; credentialId: string; url: string }>(
    apaar ? `/api/v1/credentials/${apaar}/qr` : null
  );

  const [share, setShare] = useState(false);
  const [fields, setFields] = useState<string[]>([
    "name",
    "institution",
    "program",
    "academicYear",
    "status",
  ]);
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  const [purpose, setPurpose] = useState("employment");
  const [requester, setRequester] = useState("");
  const [days, setDays] = useState(7);
  const [accepted, setAccepted] = useState(false);
<<<<<<< HEAD
  const [link, setLink] = useState<{ link: string; code: string; consentId: string; expiresAt: string } | null>(null);
=======
  const [link, setLink] = useState<{
    link: string;
    code: string;
    consentId: string;
    expiresAt: string;
  } | null>(null);
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  const [busy, setBusy] = useState(false);

  if (isLoading) return <SkeletonRows rows={8} />;
  if (error || !data) return <ErrorNote error={error} />;
  const r = data.record;

  return (
<<<<<<< HEAD
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
=======
    <div className="space-y-6">
      <WelcomeHero
        title="My Academic Identity"
        subtitle="Your official verified academic record held by AICTE, keyed by APAAR ID. You govern who can verify your credentials, for what purpose, and until what date."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="md"
              onClick={() => {
                setShare(true);
                setLink(null);
                setAccepted(false);
              }}
            >
              <Share2 className="h-4 w-4" /> Share Verification Link
            </Button>
            <Button asChild variant="secondary" size="md">
              <a href={`/api/v1/credentials/${r.apaarId}/pdf`}>
                <Download className="h-4 w-4" /> Download PDF Credential
              </a>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,480px)_1fr]">
        {/* ========================================================= */}
        {/* DIGITAL ACADEMIC CREDENTIAL CARD */}
        {/* ========================================================= */}
        <Card className="overflow-hidden border border-line shadow-card flex flex-col justify-between">
          <div>
            {/* National Tricolour Strip */}
            <div className="flex h-1.5 w-full" aria-hidden>
              <div className="flex-1 bg-saffron" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-indgreen" />
            </div>

            {/* Credential Header */}
            <div className="bg-[#082B63] px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-saffron">
                    AICTE Digital Academic Credential
                  </span>
                  <p className="text-sm font-bold tracking-tight text-white mt-0.5">{r.institution}</p>
                </div>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success border border-success/30">
                  W3C VC 2.0
                </span>
              </div>
            </div>

            {/* Credential Core Content */}
            <div className="grid grid-cols-[1fr_auto] gap-5 p-6 bg-white">
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="font-semibold text-muted text-[11px] uppercase tracking-wider">Student Name</dt>
                  <dd className="text-lg font-bold text-ink tracking-tight mt-0.5">{r.name}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-muted text-[11px] uppercase tracking-wider">APAAR ID</dt>
                  <dd className="font-mono text-sm font-bold text-navy tracking-wider mt-0.5">
                    {r.apaarId.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-muted text-[11px] uppercase tracking-wider">Academic Program</dt>
                  <dd className="font-semibold text-ink text-xs mt-0.5">
                    {r.programName} <span className="text-muted font-normal">({r.programLevel})</span>
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="font-semibold text-muted text-[10.5px] uppercase tracking-wider">Academic Year</dt>
                    <dd className="font-medium text-ink mt-0.5">{r.academicYear}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted text-[10.5px] uppercase tracking-wider">Enrollment Status</dt>
                    <dd className="mt-0.5">
                      <StatusBadge status={r.status} label={STATUS_TEXT[r.status] ?? r.status} />
                    </dd>
                  </div>
                </div>
              </dl>

              {/* Dynamic QR Code & Signature Badge */}
              <div className="flex flex-col items-center justify-center pl-2">
                {qr ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qr.qr}
                    alt="Cryptographic QR code to verify this academic record"
                    className="h-32 w-32 rounded-xl border border-line p-1 shadow-2xs"
                  />
                ) : (
                  <Skeleton className="h-32 w-32 rounded-xl" />
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-success">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Ed25519 Verified
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2.5 border-t border-line bg-page p-4">
            <Button asChild size="md" className="flex-1">
              <a href={`/api/v1/credentials/${r.apaarId}/pdf`}>
                <Download className="h-4 w-4" /> Download Certificate
              </a>
            </Button>
            <Button
              size="md"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShare(true);
                setLink(null);
                setAccepted(false);
              }}
            >
              <Share2 className="h-4 w-4" /> Share with Verifier
            </Button>
          </div>
        </Card>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: RECORD DETAILS & CONSENT OVERVIEW */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Consent at a Glance */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Pending Verifications</p>
                <p className="mt-2 text-3xl font-extrabold text-[#9A6200] leading-none">
                  {data.consentSummary.pending}
                </p>
                <p className="mt-1 text-[11px] text-muted">Employers/agencies requesting your consent</p>
              </div>
              <div className="mt-4 pt-3 border-t border-line">
                <Link
                  href="/student/consent"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                >
                  Review Requests <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Active Consents</p>
                <p className="mt-2 text-3xl font-extrabold text-success leading-none">
                  {data.consentSummary.active}
                </p>
                <p className="mt-1 text-[11px] text-muted">Currently authorized verification codes</p>
              </div>
              <div className="mt-4 pt-3 border-t border-line">
                <Link
                  href="/student/consent"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                >
                  Manage Permissions <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Record Attributes Table */}
          <Card>
            <CardHeader
              title="Verified Record Attributes"
              description={`Schema Version ${r.version} · Certified and stored by AICTE Central Repository`}
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/student/access">
                    <History className="h-3.5 w-3.5" /> Access History
                  </Link>
                </Button>
              }
            />
            <CardBody className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  ["Date of Birth", r.dob],
                  ["Gender", r.gender],
                  ["Social Category", r.category],
                  ["Nationality", r.nationalityStatus],
                  ["Admission Date", fmtDate(r.admissionDate)],
                  ["Institution Student ID", r.institutionStudentId ?? "—"],
                  ["Mobile Number (Masked)", r.phone ?? "—"],
                  ["Email Address", r.email ?? "—"],
                  ["Parent / Guardian", r.parentName ?? "—"],
                  ["State of Domicile", r.state ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center border-b border-line/60 pb-1.5">
                    <dt className="text-muted font-medium">{k}</dt>
                    <dd className="font-semibold text-ink text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-page p-3 text-[11px] text-muted">
                <span>Discrepancy in your record? Raise a formal correction request.</span>
                <Link href="/student/grievance" className="font-semibold text-navy hover:underline">
                  File Grievance →
                </Link>
              </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
            </CardBody>
          </Card>
        </div>
      </div>

<<<<<<< HEAD
      <Dialog open={share} onOpenChange={setShare} title="Share a verification link" description="Creates an approved consent with a 6-digit code. Anyone with the link can verify only the fields you choose, until it expires.">
        {link ? (
          <div className="space-y-3">
            <p className="text-sm">Consent <b>{link.consentId}</b> · code <b className="font-mono text-lg">{link.code}</b> · valid till {fmtDate(link.expiresAt)}</p>
            <div className="flex gap-2">
              <Input readOnly value={link.link} aria-label="Verification link" />
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(link.link).then(() => toast.success("Link copied"))} aria-label="Copy link"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted">You can revoke it any time from the Consent page.</p>
=======
      {/* Share Verification Link Modal */}
      <Dialog
        open={share}
        onOpenChange={setShare}
        title="Generate Secure Verification Link"
        description="Creates a time-bound, student-authorized verification token with a 6-digit consent code. The recipient can verify only the specific fields you approve."
      >
        {link ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/30 bg-[#EAF7EF] p-4 text-xs text-[#0E6106]">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Consent Authorized Successfully
              </div>
              <p className="mt-1">
                Consent Ref: <b className="font-mono">{link.consentId}</b> · Valid until: {fmtDate(link.expiresAt)}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider font-semibold">Verification Code:</span>
                <span className="rounded-lg bg-white px-3 py-1 font-mono text-base font-bold text-ink border border-line shadow-2xs">
                  {link.code}
                </span>
              </div>
            </div>

            <Field label="Shareable Verification URL" htmlFor="share-link">
              <div className="flex gap-2">
                <Input id="share-link" readOnly value={link.link} className="font-mono text-xs" />
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigator.clipboard.writeText(link.link).then(() => toast.success("Verification link copied"))
                  }
                  aria-label="Copy link to clipboard"
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
            </Field>

            <p className="text-xs text-muted">
              You can instantly revoke access at any time from your Consent management dashboard.
            </p>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
<<<<<<< HEAD
                setLink(await api("/api/v1/consent/share", "POST", { requesterName: requester || "Anyone with this link", purpose, fieldsAllowed: fields, validDays: days, noticeAccepted: accepted }));
=======
                setLink(
                  await api("/api/v1/consent/share", "POST", {
                    requesterName: requester || "Authorized Verifier",
                    purpose,
                    fieldsAllowed: fields,
                    validDays: days,
                    noticeAccepted: accepted,
                  })
                );
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
<<<<<<< HEAD
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
=======
            <Field label="Shared With / Verifier Name (Optional)" htmlFor="sh-req">
              <Input
                id="sh-req"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="e.g. Infosys Ltd or University Admissions"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Declared Purpose" htmlFor="sh-purpose">
                <Select id="sh-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="employment">Employment Verification</option>
                  <option value="higher-studies">Higher Studies Admission</option>
                  <option value="other">Other Legitimate Need</option>
                </Select>
              </Field>
              <Field label="Link Validity Period" htmlFor="sh-days">
                <Select id="sh-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <option value={1}>1 Day (24 Hours)</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days (1 Month)</option>
                </Select>
              </Field>
            </div>

            <fieldset>
              <legend className="label mb-2">Permitted Information Fields</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["name", "institution", "program", "academicYear", "status", "dob", "apaarId", "outcome"].map(
                  (f) => (
                    <label
                      key={f}
                      className="flex items-center gap-2 rounded-lg border border-line bg-page px-2.5 py-1.5 text-xs font-medium text-ink cursor-pointer hover:border-navy"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-navy"
                        checked={fields.includes(f)}
                        onChange={(e) =>
                          setFields((x) => (e.target.checked ? [...x, f] : x.filter((y) => y !== f)))
                        }
                      />
                      <span>{FIELD_LABEL[f] ?? f}</span>
                    </label>
                  )
                )}
              </div>
            </fieldset>

            <ConsentNotice />

            <label className="flex items-start gap-2.5 text-xs text-ink cursor-pointer pt-1">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded accent-navy"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                I have reviewed the DPDP Act 2023 statutory notice and authorize disclosure of selected fields /
                मैंने सूचना पढ़ ली है और सहमति देता/देती हूँ
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="lg" loading={busy} disabled={!accepted || !fields.length}>
                Generate Verification Link
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

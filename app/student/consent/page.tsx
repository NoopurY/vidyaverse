"use client";

import { useState } from "react";
import useSWR from "swr";
<<<<<<< HEAD
import { Check, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardHeader, ConfirmDialog, Dialog, EmptyState, PageHeader, SkeletonRows, StatusBadge } from "@/components/ui";
=======
import { Check, Clock, Eye, KeyRound, ShieldAlert, ShieldCheck, ShieldOff, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
} from "@/components/ui";
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
import { ConsentNotice } from "@/components/student/consent-notice";
import { api } from "@/lib/fetcher";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

<<<<<<< HEAD
type Consent = { consentId: string; requesterName: string; requesterContact?: string; requesterType: string; purpose: string; purposeNote?: string; fieldsAllowed: string[]; frequency: string; code: string; status: string; expiresAt: string; createdAt: string; usedCount: number; signed: boolean; history: { status: string; at: string; channel: string }[] };

const PURPOSE: Record<string, string> = { employment: "Employment verification", "higher-studies": "Higher-studies admission", regulatory: "Regulatory check", other: "Other" };

function ConsentCard({ c, onApprove, onReject, onRevoke }: { c: Consent; onApprove?: () => void; onReject?: () => void; onRevoke?: () => void }) {
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{c.requesterName} <span className="text-xs font-normal text-muted">({c.requesterType})</span></p>
          <p className="text-sm text-muted">{PURPOSE[c.purpose]}{c.purposeNote && ` – ${c.purposeNote}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          {c.signed && <Badge tone="navy">Signed artefact</Badge>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {c.fieldsAllowed.map((f) => <Badge key={f} tone="grey">{FIELD_LABEL[f] ?? f}</Badge>)}
      </div>
      <p className="mt-2 text-xs text-muted">
        {c.consentId} · code <span className="font-mono">{c.status === "approved" ? c.code : "••••••"}</span> · {c.frequency} · {c.status === "approved" || c.status === "pending" ? `expires ${fmtDate(c.expiresAt)}` : `requested ${fmtDate(c.createdAt)}`} · used {c.usedCount}×
      </p>
      {(onApprove || onRevoke) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onApprove && <Button size="lg" variant="success" onClick={onApprove}><Check className="h-4 w-4" aria-hidden /> Review & approve</Button>}
          {onReject && <Button size="lg" variant="secondary" onClick={onReject}><X className="h-4 w-4" aria-hidden /> Reject</Button>}
          {onRevoke && <Button size="lg" variant="danger" onClick={onRevoke}><ShieldOff className="h-4 w-4" aria-hidden /> Revoke</Button>}
        </div>
      )}
=======
type Consent = {
  consentId: string;
  requesterName: string;
  requesterContact?: string;
  requesterType: string;
  purpose: string;
  purposeNote?: string;
  fieldsAllowed: string[];
  frequency: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedCount: number;
  signed: boolean;
  history: { status: string; at: string; channel: string }[];
};

const PURPOSE: Record<string, string> = {
  employment: "Employment verification",
  "higher-studies": "Higher-studies admission",
  regulatory: "Regulatory check",
  other: "Other legitimate purpose",
};

function ConsentCard({
  c,
  onApprove,
  onReject,
  onRevoke,
}: {
  c: Consent;
  onApprove?: () => void;
  onReject?: () => void;
  onRevoke?: () => void;
}) {
  return (
    <li className="p-5 hover:bg-page/60 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-ink">{c.requesterName}</p>
            <span className="rounded bg-navy-light px-2 py-0.5 text-[10.5px] font-semibold text-navy capitalize">
              {c.requesterType}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Purpose: <span className="font-semibold text-ink">{PURPOSE[c.purpose] ?? c.purpose}</span>
            {c.purposeNote && ` — "${c.purposeNote}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          {c.signed && (
            <Badge tone="green">
              <ShieldCheck className="h-3 w-3" /> Signed Artefact
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
          Permitted Information Fields
        </p>
        <div className="flex flex-wrap gap-1.5">
          {c.fieldsAllowed.map((f) => (
            <Badge key={f} tone="grey">
              {FIELD_LABEL[f] ?? f}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line text-[11px] text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span>Ref: <span className="font-mono text-ink">{c.consentId}</span></span>
          <span>
            Code:{" "}
            <span className="font-mono font-bold text-navy">
              {c.status === "approved" ? c.code : "••••••"}
            </span>
          </span>
          <span>{c.frequency}</span>
          <span>
            {c.status === "approved" || c.status === "pending"
              ? `Expires: ${fmtDate(c.expiresAt)}`
              : `Requested: ${fmtDate(c.createdAt)}`}
          </span>
          <span>Verified: {c.usedCount}×</span>
        </div>

        {(onApprove || onRevoke) && (
          <div className="flex items-center gap-2">
            {onApprove && (
              <Button size="sm" variant="success" onClick={onApprove}>
                <Check className="h-3.5 w-3.5" aria-hidden /> Review & Approve
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="secondary" onClick={onReject}>
                <X className="h-3.5 w-3.5" aria-hidden /> Reject
              </Button>
            )}
            {onRevoke && (
              <Button size="sm" variant="danger" onClick={onRevoke}>
                <ShieldOff className="h-3.5 w-3.5" aria-hidden /> Revoke Access
              </Button>
            )}
          </div>
        )}
      </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    </li>
  );
}

export default function ConsentPage() {
<<<<<<< HEAD
  const { data, isLoading, mutate } = useSWR<{ items: Consent[] }>("/api/v1/consent", { refreshInterval: 10_000 });
  const [approve, setApprove] = useState<Consent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [confirm, setConfirm] = useState<{ c: Consent; action: "reject" | "revoke" } | null>(null);
  const act = async (c: Consent, action: "approve" | "reject" | "revoke") => {
    try {
      const r = await api<{ code?: string }>(`/api/v1/consent/${c.consentId}`, "PATCH", { action, noticeAccepted: action === "approve" ? accepted : undefined });
      toast.success(action === "approve" ? `Approved. Share code ${r.code} with ${c.requesterName}.` : action === "revoke" ? "Consent revoked – verification with this code now fails" : "Request rejected");
=======
  const { data, isLoading, mutate } = useSWR<{ items: Consent[] }>("/api/v1/consent", {
    refreshInterval: 10_000,
  });
  const [approve, setApprove] = useState<Consent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [confirm, setConfirm] = useState<{ c: Consent; action: "reject" | "revoke" } | null>(null);

  const act = async (c: Consent, action: "approve" | "reject" | "revoke") => {
    try {
      const r = await api<{ code?: string }>(`/api/v1/consent/${c.consentId}`, "PATCH", {
        action,
        noticeAccepted: action === "approve" ? accepted : undefined,
      });
      toast.success(
        action === "approve"
          ? `Approved. Share consent code ${r.code} with ${c.requesterName}.`
          : action === "revoke"
          ? "Consent revoked — verification with this code now fails immediately."
          : "Verification request rejected."
      );
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
<<<<<<< HEAD
=======

>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  if (isLoading) return <SkeletonRows rows={6} />;
  const items = data?.items ?? [];
  const pending = items.filter((c) => c.status === "pending");
  const active = items.filter((c) => c.status === "approved");
  const past = items.filter((c) => !["pending", "approved"].includes(c.status));
<<<<<<< HEAD
  return (
    <>
      <PageHeader title="Consent" description="You decide who can verify your record, for what purpose, which fields and for how long. Revocation is immediate." />
      <div className="space-y-6">
        <Card>
          <CardHeader title={`Pending requests (${pending.length})`} />
          {pending.length ? <ul className="divide-y divide-line">{pending.map((c) => <ConsentCard key={c.consentId} c={c} onApprove={() => { setApprove(c); setAccepted(false); }} onReject={() => setConfirm({ c, action: "reject" })} />)}</ul> : <EmptyState title="No pending requests" body="When an employer or institution asks to verify you, the request appears here and on WhatsApp." />}
        </Card>
        <Card>
          <CardHeader title={`Active consents (${active.length})`} />
          {active.length ? <ul className="divide-y divide-line">{active.map((c) => <ConsentCard key={c.consentId} c={c} onRevoke={() => setConfirm({ c, action: "revoke" })} />)}</ul> : <EmptyState title="No active consents" />}
        </Card>
        <Card>
          <CardHeader title={`Past (${past.length})`} />
          {past.length ? <ul className="divide-y divide-line">{past.map((c) => <ConsentCard key={c.consentId} c={c} />)}</ul> : <EmptyState title="Nothing here yet" />}
        </Card>
      </div>

      <Dialog open={!!approve} onOpenChange={(o) => !o && setApprove(null)} title="Approve consent request" description={approve ? `${approve.requesterName} · ${PURPOSE[approve.purpose]}` : undefined}>
        {approve && (
          <div className="space-y-4">
            <div>
              <p className="label">Fields that will be shared</p>
              <div className="flex flex-wrap gap-1.5">{approve.fieldsAllowed.map((f) => <Badge key={f}>{FIELD_LABEL[f] ?? f}</Badge>)}</div>
              <p className="mt-2 text-xs text-muted">Valid till {fmtDate(approve.expiresAt)} · {approve.frequency}</p>
            </div>
            <ConsentNotice />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> I have read the notice and give my consent / मैंने सूचना पढ़ ली है और सहमति देता/देती हूँ</label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setApprove(null)}>Cancel</Button>
              <Button variant="success" disabled={!accepted} onClick={async () => { await act(approve, "approve"); setApprove(null); }}>Approve</Button>
=======

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consent Governance & Permissions"
        description="Under the Digital Personal Data Protection (DPDP) Act 2023, you retain absolute authority over who verifies your records, what data is disclosed, and for what duration. Revocation takes effect immediately."
      />

      <div className="space-y-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader
            title={`Pending Requests (${pending.length})`}
            description="Verifiers awaiting your authorization before they can view any academic records"
          />
          {pending.length ? (
            <ul className="divide-y divide-line">
              {pending.map((c) => (
                <ConsentCard
                  key={c.consentId}
                  c={c}
                  onApprove={() => {
                    setApprove(c);
                    setAccepted(false);
                  }}
                  onReject={() => setConfirm({ c, action: "reject" })}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No pending requests"
              body="When an employer or academic institution requests access to verify your credentials, it will appear here and via WhatsApp."
            />
          )}
        </Card>

        {/* Active Consents */}
        <Card>
          <CardHeader
            title={`Active Consents (${active.length})`}
            description="Currently authorized verification tokens. You can revoke any permission with one click."
          />
          {active.length ? (
            <ul className="divide-y divide-line">
              {active.map((c) => (
                <ConsentCard
                  key={c.consentId}
                  c={c}
                  onRevoke={() => setConfirm({ c, action: "revoke" })}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No active consents"
              body="Active verification codes generated by you or approved from requests will appear here."
            />
          )}
        </Card>

        {/* Past Consents */}
        <Card>
          <CardHeader
            title={`Historical & Revoked Consents (${past.length})`}
            description="Expired, rejected, and revoked consent records"
          />
          {past.length ? (
            <ul className="divide-y divide-line">
              {past.map((c) => (
                <ConsentCard key={c.consentId} c={c} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No historical consents" body="Past permissions will be preserved here for your data audit trail." />
          )}
        </Card>
      </div>

      {/* Approve Consent Dialog */}
      <Dialog
        open={!!approve}
        onOpenChange={(o) => !o && setApprove(null)}
        title="Authorize Credential Verification Request"
        description={
          approve
            ? `Requested by ${approve.requesterName} (${approve.requesterType}) · ${PURPOSE[approve.purpose] ?? approve.purpose}`
            : undefined
        }
      >
        {approve && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-page p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Fields Disclosed Upon Approval
              </p>
              <div className="flex flex-wrap gap-1.5">
                {approve.fieldsAllowed.map((f) => (
                  <Badge key={f}>{FIELD_LABEL[f] ?? f}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Valid until: <span className="font-semibold text-ink">{fmtDate(approve.expiresAt)}</span> · Single/multi-use: {approve.frequency}
              </p>
            </div>

            <ConsentNotice />

            <label className="flex items-start gap-2.5 text-xs text-ink cursor-pointer pt-1">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded accent-navy"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                I have reviewed the DPDP Act 2023 statutory disclosure notice and authorize release of requested fields /
                मैंने सूचना पढ़ ली है और सहमति देता/देती हूँ
              </span>
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" onClick={() => setApprove(null)}>
                Cancel
              </Button>
              <Button
                variant="success"
                disabled={!accepted}
                onClick={async () => {
                  await act(approve, "approve");
                  setApprove(null);
                }}
              >
                Authorize & Release Code
              </Button>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
            </div>
          </div>
        )}
      </Dialog>
<<<<<<< HEAD
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "revoke" ? "Revoke this consent?" : "Reject this request?"}
        body={confirm?.action === "revoke" ? "Verification with this consent code will fail immediately, on the web and on WhatsApp." : "The requester will not be able to verify your record."}
        confirmLabel={confirm?.action === "revoke" ? "Revoke now" : "Reject"}
        danger
        onConfirm={() => act(confirm!.c, confirm!.action)}
      />
    </>
=======

      {/* Confirmation Dialog for Reject / Revoke */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "revoke" ? "Revoke this Active Consent?" : "Reject this Verification Request?"}
        body={
          confirm?.action === "revoke"
            ? "Verification with this consent code will fail immediately on the web and on WhatsApp. The verifier will lose all read access."
            : "The requester will be informed that the request was declined, and will be unable to access any data."
        }
        confirmLabel={confirm?.action === "revoke" ? "Revoke Immediately" : "Reject Request"}
        danger
        onConfirm={() => act(confirm!.c, confirm!.action)}
      />
    </div>
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  );
}

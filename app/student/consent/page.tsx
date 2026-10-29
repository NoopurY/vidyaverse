"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardHeader, ConfirmDialog, Dialog, EmptyState, PageHeader, SkeletonRows, StatusBadge } from "@/components/ui";
import { ConsentNotice } from "@/components/student/consent-notice";
import { api } from "@/lib/fetcher";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

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
    </li>
  );
}

export default function ConsentPage() {
  const { data, isLoading, mutate } = useSWR<{ items: Consent[] }>("/api/v1/consent", { refreshInterval: 10_000 });
  const [approve, setApprove] = useState<Consent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [confirm, setConfirm] = useState<{ c: Consent; action: "reject" | "revoke" } | null>(null);
  const act = async (c: Consent, action: "approve" | "reject" | "revoke") => {
    try {
      const r = await api<{ code?: string }>(`/api/v1/consent/${c.consentId}`, "PATCH", { action, noticeAccepted: action === "approve" ? accepted : undefined });
      toast.success(action === "approve" ? `Approved. Share code ${r.code} with ${c.requesterName}.` : action === "revoke" ? "Consent revoked – verification with this code now fails" : "Request rejected");
      mutate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  if (isLoading) return <SkeletonRows rows={6} />;
  const items = data?.items ?? [];
  const pending = items.filter((c) => c.status === "pending");
  const active = items.filter((c) => c.status === "approved");
  const past = items.filter((c) => !["pending", "approved"].includes(c.status));
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
            </div>
          </div>
        )}
      </Dialog>
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
  );
}

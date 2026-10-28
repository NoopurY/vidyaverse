"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Card } from "./ui";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import type { VerifyResult } from "@/lib/vc/sdjwt";

export function VerifyResultCard({ result, consent, offline }: { result: VerifyResult; consent?: { consentId: string; requesterName: string; purpose: string; expiresAt: string }; offline?: boolean }) {
  const effectiveValid = result.checks.every((c) => c.ok || (offline && c.key === "status"));
  return (
    <Card className="overflow-hidden" aria-live="polite">
      <div className={effectiveValid ? "flex items-center gap-4 bg-[#E7F4E4] px-5 py-4" : "flex items-center gap-4 bg-[#FDECEC] px-5 py-4"}>
        {effectiveValid ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-success bg-white text-success" aria-hidden>
            <ShieldCheck className="h-7 w-7" />
          </div>
        ) : (
          <XCircle className="h-12 w-12 shrink-0 text-danger" aria-hidden />
        )}
        <div>
          <p className={effectiveValid ? "text-lg font-semibold text-[#0E6106]" : "text-lg font-semibold text-[#9E1C1C]"}>
            {effectiveValid ? "Verified by AICTE" : "Verification failed"}
          </p>
          <p className="text-xs text-muted">
            {result.credentialId} {result.issuedAt && `· issued ${fmtDate(result.issuedAt)}`} {offline && "· verified offline with cached public key"}
          </p>
        </div>
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold">Verification checks</p>
          <ul className="space-y-2">
            {result.checks.map((c) => {
              const warn = !c.ok && offline && c.key === "status";
              return (
                <li key={c.key} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="passed" /> : warn ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="warning" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="failed" />}
                  <span>
                    {c.label}
                    {c.detail && <span className="block break-all text-xs text-muted">{c.detail}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Disclosed with consent</p>
          {Object.keys(result.disclosed).length ? (
            <dl className="divide-y divide-line rounded border border-line">
              {Object.entries(result.disclosed).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-2 px-3 py-2 text-sm">
                  <dt className="text-muted">{FIELD_LABEL[k] ?? k}</dt>
                  <dd className="font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">No fields disclosed.</p>
          )}
          <p className="mt-2 text-xs text-muted">Category, contact details and parent name are never disclosed.</p>
          {consent && (
            <p className="mt-3 rounded bg-navy-tint px-3 py-2 text-xs text-navy">
              Consent {consent.consentId} · requester {consent.requesterName} · purpose {consent.purpose} · valid till {fmtDate(consent.expiresAt)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

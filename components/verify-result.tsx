"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Lock,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, StatusBadge } from "./ui";
import { FIELD_LABEL } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import type { VerifyResult } from "@/lib/vc/sdjwt";

export function VerifyResultCard({
  result,
  consent,
  offline,
}: {
  result: VerifyResult;
  consent?: { consentId: string; requesterName: string; purpose: string; expiresAt: string };
  offline?: boolean;
}) {
  const effectiveValid = result.checks.every((c) => c.ok || (offline && c.key === "status"));

  return (
    <Card className="overflow-hidden border border-line shadow-card" aria-live="polite">
      {/* Top Banner indicating status */}
      <div
        className={
          effectiveValid
            ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9DDB1] bg-[#EAF7EF] p-5 sm:px-6"
            : "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3B9B9] bg-[#FDECEC] p-5 sm:px-6"
        }
      >
        <div className="flex items-center gap-4">
          <div
            className={
              effectiveValid
                ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-success bg-white text-success shadow-xs"
                : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-danger bg-white text-danger shadow-xs"
            }
            aria-hidden
          >
            {effectiveValid ? <ShieldCheck className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className={
                  effectiveValid
                    ? "text-xl font-bold tracking-tight text-[#0E6106]"
                    : "text-xl font-bold tracking-tight text-[#9E1C1C]"
                }
              >
                {effectiveValid ? "Credential Verified Authentic" : "Credential Verification Failed"}
              </p>
              {effectiveValid && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#0E6106]">
                  AICTE Certified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Reference: <span className="font-mono text-ink font-medium">{result.credentialId}</span>
              {result.issuedAt && ` · Issued ${fmtDate(result.issuedAt)}`}
              {offline && " · Verified offline with cached public key"}
            </p>
          </div>
        </div>

        {effectiveValid && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge tone="green">
              <CheckCircle2 className="h-3 w-3" /> Valid Status
            </Badge>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 p-6 md:grid-cols-2">
        {/* Left Column: Cryptographic and Technical Checks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Cryptographic Checks</h3>
            <span className="text-[11px] text-muted">W3C VC 2.0 / Ed25519</span>
          </div>

          <ul className="space-y-3">
            {result.checks.map((c) => {
              const warn = !c.ok && offline && c.key === "status";
              return (
                <li
                  key={c.key}
                  className="flex items-start gap-3 rounded-lg border border-line bg-page p-3 text-xs"
                >
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="passed" />
                  ) : warn ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="warning" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="failed" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{c.label}</p>
                    {c.detail && (
                      <p className="mt-0.5 font-mono text-[10.5px] text-muted break-all leading-tight">
                        {c.detail}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="rounded-lg border border-line bg-[#F8FAFD] p-3 text-[11px] text-muted leading-relaxed">
            <p className="font-semibold text-ink">Zero-Knowledge Disclosure</p>
            <p className="mt-0.5">
              Only fields explicitly authorized by the student are disclosed. Category, personal contact details, and parentage remain sealed.
            </p>
          </div>
        </div>

        {/* Right Column: Disclosed Academic Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Disclosed Record Details</h3>
            <span className="text-[11px] text-muted">Consent-Governed</span>
          </div>

          {Object.keys(result.disclosed).length ? (
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
              <dl className="divide-y divide-line text-xs">
                {Object.entries(result.disclosed).map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[130px_1fr] items-center gap-3 px-4 py-2.5 hover:bg-page transition-colors"
                  >
                    <dt className="font-semibold text-muted">{FIELD_LABEL[k] ?? k}</dt>
                    <dd className="font-medium text-ink break-words">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-page p-6 text-center text-xs text-muted">
              No fields were disclosed with this verification request.
            </div>
          )}

          {consent && (
            <div className="rounded-xl border border-navy/20 bg-navy-light/60 p-4 text-xs text-navy">
              <div className="flex items-center gap-1.5 font-bold">
                <UserCheck className="h-4 w-4" />
                <span>Authorized Consent Artefact</span>
              </div>
              <p className="mt-1 text-[11.5px] text-ink leading-relaxed">
                Consent Reference: <b className="font-mono">{consent.consentId}</b> · Requester: <b>{consent.requesterName}</b>
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                Declared Purpose: <span className="capitalize">{consent.purpose}</span> · Valid until: {fmtDate(consent.expiresAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, ConfirmDialog, Field, Input, PageHeader, SkeletonRows } from "@/components/ui";
import { api } from "@/lib/fetcher";
import type { RulesT } from "@/lib/rules";

const WEIGHT_LABEL: Record<string, string> = {
  intakeBreach: "Intake breach attempts",
  crossDuplicate: "Cross-institution duplicates",
  counsellingMismatch: "Counselling mismatches",
  scholarshipMismatch: "Scholarship mismatches",
  sharedContact: "Shared contacts",
  yoyJump: "Year-on-year enrolment jump",
  fullFillHighForeign: "100% fill + high NRI/FN share",
  lateUpload: "Late bulk uploads",
  openIssues: "Open issue count",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const canEdit = session?.user?.permission === "full";
  const { data, mutate } = useSWR<RulesT>("/api/v1/rules");
  const [r, setR] = useState<RulesT | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (data) setR({ ...data, deadlineDate: new Date(data.deadlineDate) });
  }, [data]);
  if (!r) return <SkeletonRows rows={10} />;
  const num = (v: string) => (v === "" ? 0 : Number(v));
  const totalWeight = Object.values(r.riskWeights).reduce((a, b) => a + b, 0);
  const dl = new Date(r.deadlineDate);
  const localDl = new Date(dl.getTime() - dl.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <>
      <PageHeader
        title="Settings – Rules engine"
        description="Nothing is hard-coded: quotas, thresholds and risk weights come from here. Every change is audited and risk scores are recomputed."
        actions={canEdit && <Button onClick={() => setConfirm(true)}><Save className="h-4 w-4" aria-hidden /> Save rules</Button>}
      />
      {!canEdit && <p className="mb-4 rounded bg-navy-tint px-4 py-3 text-sm text-navy">Only AICTE HQ (full permission) can edit rules. You are viewing them read-only.</p>}
      <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Supernumerary quota limits" description="% of approved intake (caps seat tokens per type)" />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            {(["nri", "oci", "fn", "tfw", "other"] as const).map((k) => (
              <Field key={k} label={`${k.toUpperCase()} %`} htmlFor={`q-${k}`}>
                <Input id={`q-${k}`} type="number" min={0} max={100} value={r.quotaLimits[k]} onChange={(e) => setR({ ...r, quotaLimits: { ...r.quotaLimits, [k]: num(e.target.value) } })} />
              </Field>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Detection thresholds" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Fuzzy name-match threshold" htmlFor="fz" hint="Jaro-Winkler 0.5–1 (default 0.9)">
              <Input id="fz" type="number" step="0.01" min={0.5} max={1} value={r.fuzzyThreshold} onChange={(e) => setR({ ...r, fuzzyThreshold: num(e.target.value) })} />
            </Field>
            <Field label="Ghost shared-contact threshold" htmlFor="gc" hint="Students sharing one phone/email">
              <Input id="gc" type="number" min={2} value={r.ghostSharedContactThreshold} onChange={(e) => setR({ ...r, ghostSharedContactThreshold: num(e.target.value) })} />
            </Field>
            <Field label="YoY enrolment jump threshold (%)" htmlFor="yoy">
              <Input id="yoy" type="number" min={10} value={r.yoyJumpThreshold} onChange={(e) => setR({ ...r, yoyJumpThreshold: num(e.target.value) })} />
            </Field>
            <Field label="Submission deadline" htmlFor="dl" hint="Bulk uploads in the final hour are flagged">
              <Input id="dl" type="datetime-local" value={localDl} onChange={(e) => setR({ ...r, deadlineDate: new Date(e.target.value) })} />
            </Field>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Risk score weights" description={`Maximum points per factor (sum ${totalWeight}; the score is capped at 100)`} />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            {Object.entries(r.riskWeights).map(([k, v]) => (
              <Field key={k} label={WEIGHT_LABEL[k] ?? k} htmlFor={`w-${k}`}>
                <Input id={`w-${k}`} type="number" min={0} max={50} value={v} onChange={(e) => setR({ ...r, riskWeights: { ...r.riskWeights, [k]: num(e.target.value) } })} />
              </Field>
            ))}
          </CardBody>
        </Card>
      </fieldset>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Save rule changes?"
        body="New rules apply immediately to validation, the seat ledger (new tokens) and risk scoring. The change is recorded in the audit log."
        confirmLabel="Save"
        onConfirm={async () => {
          try {
            await api("/api/v1/rules", "PUT", r);
            toast.success("Rules saved and risk scores recomputed");
            mutate();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}

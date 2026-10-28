"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, SkeletonRows } from "@/components/ui";
import type { MeResponse } from "@/components/student/types";
import { api } from "@/lib/fetcher";

export default function Outcomes() {
  const { data, mutate } = useSWR<MeResponse>("/api/v1/me");
  const [f, setF] = useState({ type: "placement", organisation: "", year: new Date().getFullYear(), consentGiven: false });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const o = data?.record.outcome;
    if (o && o.type !== "none") setF({ type: o.type, organisation: o.organisation ?? "", year: o.year ?? new Date().getFullYear(), consentGiven: !!o.consentGiven });
  }, [data]);
  if (!data) return <SkeletonRows />;
  return (
    <>
      <PageHeader title="Outcomes" description="Tell AICTE where you went after your program. With your consent, the outcome appears on your verifiable record; aggregate rates feed accreditation reports." />
      <Card className="max-w-2xl">
        <CardHeader title="My outcome" />
        <CardBody>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api("/api/v1/me/outcome", "POST", { ...f, year: Number(f.year), organisation: f.type === "none" ? undefined : f.organisation });
                toast.success("Outcome saved. Your credential was re-issued with the update.");
                mutate();
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Outcome" htmlFor="o-type">
              <Select id="o-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                <option value="placement">Placement (job)</option>
                <option value="higher-studies">Higher studies</option>
                <option value="none">Not yet / prefer not to say</option>
              </Select>
            </Field>
            <Field label="Year" htmlFor="o-year"><Input id="o-year" type="number" min={2015} max={2035} value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} disabled={f.type === "none"} /></Field>
            <Field label={f.type === "higher-studies" ? "University / institute" : "Organisation"} htmlFor="o-org" className="sm:col-span-2"><Input id="o-org" required={f.type !== "none"} value={f.organisation} onChange={(e) => setF({ ...f, organisation: e.target.value })} disabled={f.type === "none"} /></Field>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy" checked={f.consentGiven} onChange={(e) => setF({ ...f, consentGiven: e.target.checked })} />
              I consent to this outcome being included in my verifiable record and in AICTE&apos;s anonymised outcome statistics.
            </label>
            <div className="sm:col-span-2"><Button type="submit" size="lg" loading={busy}><Trophy className="h-4 w-4" aria-hidden /> Save outcome</Button></div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}

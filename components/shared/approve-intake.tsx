"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Dialog, Field, Input, Select } from "../ui";
import { api } from "@/lib/fetcher";
import { DISCIPLINES } from "@/lib/constants";

/** AICTE approves (or increases) a program's intake → seat tokens are minted for the year */
export function ApproveIntakeButton({ institutionId, onDone }: { institutionId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ programId: "", name: "", level: "UG", discipline: "CSE", approvedIntake: 60, nri: 6, oci: 2, fn: 2, tfw: 3, other: 0, academicYear: "2025-26" });
  const set = (k: keyof typeof f, num = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: num ? Number(e.target.value) : e.target.value }));
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Approve intake</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Approve program intake" description="Seat tokens are generated for every approved seat. Supernumerary seats are capped by the quota rules." wide>
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await api<{ tokensCreated: number }>(`/api/v1/institutions/${institutionId}/programs`, "POST", {
                programId: f.programId.toUpperCase(), name: f.name, level: f.level, discipline: f.discipline, approvedIntake: f.approvedIntake, academicYear: f.academicYear,
                supernumeraryApproved: { nri: f.nri, oci: f.oci, fn: f.fn, tfw: f.tfw, other: f.other },
              });
              toast.success(`Intake approved – ${r.tokensCreated} seat tokens issued`);
              setOpen(false);
              onDone();
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Program ID" htmlFor="ai-id"><Input id="ai-id" required value={f.programId} onChange={set("programId")} placeholder="P5" /></Field>
          <Field label="Program name" htmlFor="ai-name" className="sm:col-span-2"><Input id="ai-name" required value={f.name} onChange={set("name")} placeholder="B.Tech Computer Science" /></Field>
          <Field label="Level" htmlFor="ai-level"><Select id="ai-level" value={f.level} onChange={set("level")}><option>UG</option><option>PG</option><option>Diploma</option></Select></Field>
          <Field label="Discipline" htmlFor="ai-disc"><Select id="ai-disc" value={f.discipline} onChange={set("discipline")}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Academic year" htmlFor="ai-year"><Select id="ai-year" value={f.academicYear} onChange={set("academicYear")}><option>2025-26</option><option>2024-25</option></Select></Field>
          <Field label="Approved intake (regular)" htmlFor="ai-intake"><Input id="ai-intake" type="number" min={1} required value={f.approvedIntake} onChange={set("approvedIntake", true)} /></Field>
          {(["nri", "oci", "fn", "tfw", "other"] as const).map((k) => (
            <Field key={k} label={`Supernumerary ${k.toUpperCase()}`} htmlFor={`ai-${k}`}><Input id={`ai-${k}`} type="number" min={0} value={f[k]} onChange={set(k, true)} /></Field>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={busy}>Approve & issue seats</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Select } from "../ui";
import { api, FetchError } from "@/lib/fetcher";
import { TEMPLATE_COLUMNS, type StudentRow } from "@/lib/validation/schema";
import { validateRow, type RowIssue } from "@/lib/validation/rowRules";

const EMPTY: StudentRow = Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c.key, ""])) as StudentRow;

/** Single-student add form with the same instant rule engine as uploads */
export function StudentForm({ programs, onDone }: { programs: { programId: string; name: string }[]; onDone: () => void }) {
  const [row, setRow] = useState<StudentRow>({ ...EMPTY, nri: "N", oci: "N", foreignNational: "N", seatType: "regular", academicYear: "2025-26", status: "active", category: "General" });
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof StudentRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRow((r) => ({ ...r, [k]: e.target.value }));
  const errFor = (k: string) => issues.find((i) => i.field === k && i.severity !== "low")?.message;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = validateRow(row, { programIds: programs.map((p) => p.programId) });
    setIssues(local);
    if (local.some((i) => i.severity === "high")) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ warnings: RowIssue[] }>("/api/v1/students", "POST", { student: row }, { "Idempotency-Key": crypto.randomUUID() });
      toast.success("Student added – seat consumed from the ledger", { description: r.warnings.length ? `${r.warnings.length} warning(s) recorded for review` : undefined });
      onDone();
    } catch (err) {
      const fe = err as FetchError;
      const serverIssues = (fe.details as { issues?: RowIssue[] } | undefined)?.issues;
      if (serverIssues) setIssues(serverIssues);
      toast.error(fe.message, { description: serverIssues?.[0]?.fixHint });
    } finally {
      setBusy(false);
    }
  };

  const text = (k: keyof StudentRow, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label} htmlFor={`sf-${k}`} error={errFor(k)}>
      <Input id={`sf-${k}`} value={row[k]} onChange={set(k)} aria-invalid={!!errFor(k)} {...props} />
    </Field>
  );
  const select = (k: keyof StudentRow, label: string, options: [string, string][]) => (
    <Field label={label} htmlFor={`sf-${k}`} error={errFor(k)}>
      <Select id={`sf-${k}`} value={row[k]} onChange={set(k)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </Field>
  );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3" noValidate>
      {text("apaarId", "APAAR ID *", { inputMode: "numeric", maxLength: 12, placeholder: "12 digits" })}
      {text("name", "Full name *")}
      {text("dob", "Date of birth *", { type: "date" })}
      {select("gender", "Gender *", [["", "Select"], ["M", "Male"], ["F", "Female"], ["T", "Transgender"]])}
      {text("parentName", "Parent / guardian name *")}
      {text("phone", "Mobile *", { inputMode: "numeric", maxLength: 10 })}
      {text("email", "Email", { type: "email" })}
      {select("category", "Category *", ["General", "SC", "ST", "OBC", "EWS"].map((c) => [c, c]))}
      {text("institutionStudentId", "Institution student ID")}
      {select("nri", "NRI", [["N", "No"], ["Y", "Yes"]])}
      {select("oci", "OCI", [["N", "No"], ["Y", "Yes"]])}
      {select("foreignNational", "Foreign national", [["N", "No"], ["Y", "Yes"]])}
      {select("programId", "Program *", [["", "Select"], ...programs.map((p) => [p.programId, `${p.programId} – ${p.name}`] as [string, string])])}
      {select("seatType", "Seat type *", [["regular", "Regular"], ["nri", "NRI (supernumerary)"], ["oci", "OCI (supernumerary)"], ["fn", "Foreign National (supernumerary)"], ["tfw", "Tuition Fee Waiver"], ["other", "Other supernumerary"]])}
      {select("academicYear", "Academic year *", [["2025-26", "2025-26"], ["2024-25", "2024-25"]])}
      {text("admissionDate", "Admission date *", { type: "date" })}
      {text("counsellingRef", "Counselling reference")}
      {issues.length > 0 && (
        <ul className="space-y-1 rounded border border-[#F3B9B9] bg-[#FDECEC] p-3 text-xs sm:col-span-3" role="alert">
          {issues.map((i, n) => (
            <li key={n}>
              <b>{i.message}.</b> {i.fixHint}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2 sm:col-span-3">
        <Button type="submit" size="lg" loading={busy}>Add student</Button>
      </div>
    </form>
  );
}

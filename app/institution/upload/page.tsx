"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { CheckCircle2, Download, FileSpreadsheet, Lightbulb, Send, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, PageHeader, SeverityBadge, StatusBadge, Table, Tip } from "@/components/ui";
import { useT } from "@/components/providers";
import type { InstitutionDetail } from "@/components/shared/types";
import { api } from "@/lib/fetcher";
import { normaliseRow, TEMPLATE_COLUMNS, type StudentRow } from "@/lib/validation/schema";
import { validateRow, type RowIssue } from "@/lib/validation/rowRules";
import { ISSUE_LABEL } from "@/lib/constants";
import { cn, fmtDate } from "@/lib/utils";

type Parsed = { rows: StudentRow[]; fileName: string };
type Result = { rowNumber: number; issues: RowIssue[]; blocking: boolean };
type Batch = { _id: string; fileName: string; rowCount: number; validRows: number; errorRows: number; status: string; uploadedBy: string; createdAt: string; submittedAt?: string; commitSummary?: { committed: number; rejectedBySeatLedger: number; skippedWithErrors: number } };
type Assist = { engine: string; items: { rowNumber: number; type: string; explanation: string; fix: string }[] };

async function parseFile(file: File): Promise<StudentRow[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = wb.Sheets["Students"] ?? wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  return raw.filter((r) => Object.values(r).some((v) => String(v).trim() !== "")).map(normaliseRow);
}

export default function UploadPage() {
  const { t, lang } = useT();
  const { data: session } = useSession();
  const isAdmin = session?.user?.permission === "admin";
  const id = session?.user?.institutionId;
  const { data: inst } = useSWR<InstitutionDetail>(id ? `/api/v1/institutions/${id}` : null);
  const { data: batches, mutate: refreshBatches } = useSWR<{ items: Batch[] }>("/api/v1/uploads?limit=10");
  const programIds = useMemo(() => inst?.institution.programs.map((p) => p.programId) ?? [], [inst]);

  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [serverChecked, setServerChecked] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [assist, setAssist] = useState<Assist | null>(null);
  const [assistLang, setAssistLang] = useState<"en" | "hi" | "mr">(lang);
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    async (file: File) => {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return toast.error("Please upload an .xlsx or .csv file");
      if (file.size > 5 * 1024 * 1024) return toast.error("File is larger than 5 MB");
      setBusy("parse");
      try {
        const rows = await parseFile(file);
        if (!rows.length) throw new Error("No data rows found. Keep the header row from the template.");
        setParsed({ rows, fileName: file.name });
        setResults(rows.map((r, i) => {
          const issues = validateRow(r, { programIds });
          return { rowNumber: i + 2, issues, blocking: issues.some((x) => x.severity === "high") };
        }));
        setServerChecked(false);
        setBatchId(null);
        setAssist(null);
        toast.success(`${rows.length} rows read from ${file.name}`);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [programIds]
  );

  const errorRows = results.filter((r) => r.blocking).length;
  const warnRows = results.filter((r) => !r.blocking && r.issues.length).length;

  const validateOnServer = async () => {
    if (!parsed) return;
    setBusy("validate");
    try {
      const r = await api<{ batchId: string; results: Result[]; errorRows: number }>("/api/v1/uploads", "POST", { fileName: parsed.fileName, rows: parsed.rows }, { "Idempotency-Key": crypto.randomUUID() });
      setResults(r.results);
      setServerChecked(true);
      setBatchId(r.batchId);
      refreshBatches();
      toast.success("Validated against the APAAR registry, duplicates and your seat ledger", { description: `${r.errorRows} row(s) with blocking errors` });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!batchId) return;
    setBusy("submit");
    try {
      const r = await api<{ lateUpload: boolean }>(`/api/v1/uploads/${batchId}/submit`, "POST");
      toast.success(isAdmin ? "Submitted. Approve it below to commit." : "Submitted for approval by your institution admin");
      if (r.lateUpload) toast.warning("Note: bulk upload in the final hour before the deadline is flagged for AICTE review");
      setParsed(null);
      setResults([]);
      setBatchId(null);
      refreshBatches();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const helpMeFix = async (l = assistLang) => {
    const errors = results.flatMap((r) => r.issues.map((i) => ({ rowNumber: r.rowNumber, type: i.type, field: i.field ? String(i.field) : undefined, message: i.message }))).slice(0, 60);
    if (!errors.length) return toast.info("No errors to explain – all rows look good");
    setBusy("assist");
    try {
      setAssist(await api<Assist>("/api/v1/assist", "POST", { lang: l, errors }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shown = parsed ? parsed.rows.map((r, i) => ({ r, res: results[i] })).filter((x) => !errorsOnly || x.res?.issues.length) : [];
  const cols = TEMPLATE_COLUMNS.filter((c) => !["email", "institutionStudentId", "counsellingRef"].includes(c.key));

  return (
    <>
      <PageHeader
        title={t("uploadTitle")}
        description={t("uploadSteps")}
        actions={
          <>
            <Button asChild variant="secondary"><a href="/api/v1/uploads/template"><Download className="h-4 w-4" aria-hidden /> {t("downloadTemplate")} (.xlsx)</a></Button>
            <Button asChild variant="ghost"><a href="/api/v1/uploads/template?format=csv">CSV</a></Button>
            <Button asChild variant="ghost"><a href="/samples/demo-upload.xlsx" download>{t("sampleFile")}</a></Button>
          </>
        }
      />

      <Card>
        <CardBody>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
            className={cn("flex flex-col items-center justify-center rounded border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-navy bg-navy-tint" : "border-line bg-page")}
          >
            <UploadCloud className="h-10 w-10 text-navy" aria-hidden />
            <p className="mt-3 text-base font-semibold">{t("dropHere")}</p>
            <p className="mt-1 text-sm text-muted">{t("dropHelp")}</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            <Button size="lg" className="mt-4" onClick={() => fileRef.current?.click()} loading={busy === "parse"}>
              <FileSpreadsheet className="h-5 w-5" aria-hidden /> {t("chooseFile")}
            </Button>
          </div>
        </CardBody>
      </Card>

      {parsed && (
        <Card className="mt-6">
          <CardHeader
            title={`Preview – ${parsed.fileName}`}
            description={
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone="navy">{parsed.rows.length} rows</Badge>
                <Badge tone={errorRows ? "red" : "green"}>{errorRows} with errors</Badge>
                <Badge tone="amber">{warnRows} with warnings</Badge>
                {serverChecked ? <Badge tone="green"><ShieldCheck className="h-3 w-3" aria-hidden /> Server-validated</Badge> : <Badge tone="grey">Browser checks only</Badge>}
              </span>
            }
            action={
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-navy" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} /> Show only rows with issues
                </label>
                <Button variant="secondary" onClick={() => helpMeFix()} loading={busy === "assist"}><Lightbulb className="h-4 w-4" aria-hidden /> {t("helpMeFix")}</Button>
                {!serverChecked ? (
                  <Button onClick={validateOnServer} loading={busy === "validate"}><ShieldCheck className="h-4 w-4" aria-hidden /> {t("validateSave")}</Button>
                ) : (
                  <Button onClick={submit} loading={busy === "submit"} disabled={parsed.rows.length === errorRows}><Send className="h-4 w-4" aria-hidden /> {t("submit")} ({parsed.rows.length - errorRows} valid rows)</Button>
                )}
              </div>
            }
          />
          {assist && (
            <div className="border-b border-line bg-[#FFFBEF] px-5 py-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Lightbulb className="h-5 w-5 text-saffron" aria-hidden />
                <p className="font-semibold">AI error assistant</p>
                <Badge tone="grey">{assist.engine === "llm" ? "AI" : "Guided hints"}</Badge>
                <div className="ml-auto flex rounded border border-line bg-white p-0.5" role="group" aria-label="Assistant language">
                  {(["en", "hi", "mr"] as const).map((l) => (
                    <button key={l} aria-pressed={assistLang === l} onClick={() => { setAssistLang(l); helpMeFix(l); }} className={assistLang === l ? "rounded bg-navy px-2.5 py-0.5 text-xs text-white" : "rounded px-2.5 py-0.5 text-xs text-navy"}>
                      {{ en: "English", hi: "हिंदी", mr: "मराठी" }[l]}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
                {assist.items.map((a, i) => (
                  <li key={i} className="rounded border border-line bg-white px-3 py-2">
                    <p className="font-medium">{a.explanation}</p>
                    <p className="text-muted">→ {a.fix}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="max-h-[560px] overflow-auto">
            <Table caption="Upload preview">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="th">Row</th>
                  <th className="th">Issues</th>
                  {cols.map((c) => <th key={c.key} className="th">{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map(({ r, res }) => {
                  const fields = new Set(res?.issues.filter((i) => i.severity !== "low").map((i) => String(i.field)));
                  return (
                    <tr key={res?.rowNumber} className={res?.blocking ? "flagged-row bg-[#FFF8F8]" : undefined}>
                      <td className="td text-xs text-muted">{res?.rowNumber}</td>
                      <td className="td min-w-[240px]">
                        {res?.issues.length ? (
                          <ul className="space-y-1">
                            {res.issues.map((i, n) => (
                              <li key={n} className="flex items-start gap-1.5 text-xs">
                                <SeverityBadge severity={i.severity} />
                                <Tip content={i.fixHint}><span tabIndex={0} className="underline decoration-dotted underline-offset-2">{i.message}</span></Tip>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-4 w-4" aria-hidden /> OK</span>
                        )}
                      </td>
                      {cols.map((c) => (
                        <td key={c.key} className={cn("td whitespace-nowrap text-xs", fields.has(c.key) && "bg-[#FDECEC] font-semibold text-[#9E1C1C]")}>
                          {r[c.key] || (fields.has(c.key) ? "(empty)" : "")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Recent uploads" description={isAdmin ? "As institution admin you approve submitted uploads; valid rows are committed through the seat ledger." : "Submitted uploads are approved by your institution admin."} />
        {!batches?.items.length ? (
          <EmptyState title="No uploads yet" body="Your validated drafts and submissions will appear here." />
        ) : (
          <Table caption="Upload batches">
            <thead><tr>{["File", "Rows", "Valid", "Errors", "Status", "By", "When", "Result", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {batches.items.map((b) => (
                <tr key={b._id}>
                  <td className="td font-medium">{b.fileName}</td>
                  <td className="td">{b.rowCount}</td>
                  <td className="td">{b.validRows}</td>
                  <td className="td">{b.errorRows}</td>
                  <td className="td"><StatusBadge status={b.status} /></td>
                  <td className="td text-xs">{b.uploadedBy}</td>
                  <td className="td whitespace-nowrap text-xs">{fmtDate(b.submittedAt ?? b.createdAt, true)}</td>
                  <td className="td text-xs">{b.commitSummary ? `${b.commitSummary.committed} committed · ${b.commitSummary.rejectedBySeatLedger} blocked by ledger · ${b.commitSummary.skippedWithErrors} skipped` : "—"}</td>
                  <td className="td whitespace-nowrap">
                    {isAdmin && b.status === "submitted" && (
                      <>
                        <Button size="sm" variant="success" onClick={() => setConfirm({ id: b._id, action: "approve" })}>{t("approve")}</Button>{" "}
                        <Button size="sm" variant="ghost" onClick={() => setConfirm({ id: b._id, action: "reject" })}>{t("reject")}</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <OutcomesUpload />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "approve" ? "Approve and commit this upload?" : "Reject this upload?"}
        body={confirm?.action === "approve" ? "Valid rows are committed to the AICTE central repository. Each admission consumes a seat token; admissions beyond approved intake are blocked and reported." : "The batch will be closed without committing any rows."}
        confirmLabel={confirm?.action === "approve" ? "Approve & commit" : "Reject"}
        danger={confirm?.action === "reject"}
        onConfirm={async () => {
          try {
            const r = await api<{ committed?: number; rejectedBySeatLedger?: number; skippedWithErrors?: number }>(`/api/v1/uploads/${confirm!.id}/approve`, "POST", { action: confirm!.action }, { "Idempotency-Key": crypto.randomUUID() });
            if (confirm!.action === "approve") {
              toast.success(`${r.committed} student(s) committed`, { description: `${r.rejectedBySeatLedger} blocked by the seat ledger · ${r.skippedWithErrors} skipped with errors` });
              if (r.rejectedBySeatLedger) toast.error("Admissions beyond approved intake were blocked. AICTE has been alerted.");
            } else toast.success("Upload rejected");
            refreshBatches();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}

function OutcomesUpload() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="mt-6">
      <CardHeader title="Bulk-upload outcomes" description="Columns: apaarId, type (placement | higher-studies | none), organisation, year. Students confirm consent before outcomes are disclosed." />
      <CardBody className="flex flex-wrap items-center gap-3">
        <input
          ref={ref}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              const XLSX = await import("xlsx");
              const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
              const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" }).map((r) => ({ ...r, apaarId: String(r.apaarId ?? "") }));
              const r = await api<{ matched: number; invalid: { row: number; error: string }[] }>("/api/v1/outcomes/upload", "POST", { rows }, { "Idempotency-Key": crypto.randomUUID() });
              toast.success(`${r.matched} outcome(s) updated`, { description: r.invalid.length ? `${r.invalid.length} invalid row(s), e.g. row ${r.invalid[0].row}: ${r.invalid[0].error}` : undefined });
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button variant="secondary" onClick={() => ref.current?.click()} loading={busy}><UploadCloud className="h-4 w-4" aria-hidden /> Upload outcomes file</Button>
        <span className="text-xs text-muted">Issue types: {Object.keys(ISSUE_LABEL).length} validation rules run on every upload.</span>
      </CardBody>
    </Card>
  );
}

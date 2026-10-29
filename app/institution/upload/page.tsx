"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SeverityBadge,
  StatusBadge,
  StepTimeline,
  Table,
  Tip,
} from "@/components/ui";
import { useT } from "@/components/providers";
import type { InstitutionDetail } from "@/components/shared/types";
import { api } from "@/lib/fetcher";
import { normaliseRow, TEMPLATE_COLUMNS, type StudentRow } from "@/lib/validation/schema";
import { validateRow, type RowIssue } from "@/lib/validation/rowRules";
import { ISSUE_LABEL } from "@/lib/constants";
import { cn, fmtDate } from "@/lib/utils";

type Parsed = { rows: StudentRow[]; fileName: string };
type Result = { rowNumber: number; issues: RowIssue[]; blocking: boolean };
type Batch = {
  _id: string;
  fileName: string;
  rowCount: number;
  validRows: number;
  errorRows: number;
  status: string;
  uploadedBy: string;
  createdAt: string;
  submittedAt?: string;
  commitSummary?: { committed: number; rejectedBySeatLedger: number; skippedWithErrors: number };
};
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
  const [assistLang, setAssistLang] = useState<"en" | "hi">(lang === "hi" ? "hi" : "en");
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    async (file: File) => {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        return toast.error("Please upload an .xlsx, .xls, or .csv file");
      }
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("File exceeds maximum permitted size of 5 MB");
      }
      setBusy("parse");
      try {
        const rows = await parseFile(file);
        if (!rows.length) {
          throw new Error("No data rows detected. Please preserve header rows from the approved template.");
        }
        setParsed({ rows, fileName: file.name });
        setResults(
          rows.map((r, i) => {
            const issues = validateRow(r, { programIds });
            return { rowNumber: i + 2, issues, blocking: issues.some((x) => x.severity === "high") };
          })
        );
        setServerChecked(false);
        setBatchId(null);
        setAssist(null);
        toast.success(`Successfully read ${rows.length} records from ${file.name}`);
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
      const r = await api<{ batchId: string; results: Result[]; errorRows: number }>(
        "/api/v1/uploads",
        "POST",
        { fileName: parsed.fileName, rows: parsed.rows },
        { "Idempotency-Key": crypto.randomUUID() }
      );
      setResults(r.results);
      setServerChecked(true);
      setBatchId(r.batchId);
      refreshBatches();
      toast.success("Validated against official APAAR registry, duplicates, and digital seat ledger", {
        description: `${r.errorRows} record(s) flagged with blocking validation errors.`,
      });
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
      toast.success(isAdmin ? "Submitted. Approve batch below to commit records." : "Submitted for institutional approval.");
      if (r.lateUpload) {
        toast.warning("Notice: Upload within the final 60 minutes of the admission deadline is flagged for review.");
      }
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
    const errors = results
      .flatMap((r) =>
        r.issues.map((i) => ({
          rowNumber: r.rowNumber,
          type: i.type,
          field: i.field ? String(i.field) : undefined,
          message: i.message,
        }))
      )
      .slice(0, 60);
    if (!errors.length) return toast.info("No errors detected – all records meet formatting standards.");
    setBusy("assist");
    try {
      setAssist(await api<Assist>("/api/v1/assist", "POST", { lang: l, errors }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shown = parsed
    ? parsed.rows.map((r, i) => ({ r, res: results[i] })).filter((x) => !errorsOnly || x.res?.issues.length)
    : [];
  const cols = TEMPLATE_COLUMNS.filter((c) => !["email", "institutionStudentId", "counsellingRef"].includes(c.key));

  const currentWorkflowStep = !parsed ? 1 : !serverChecked ? 2 : !batchId ? 3 : 4;

  const workflowSteps = [
    { label: "Download Template", description: "Use the approved AICTE schema (.xlsx / .csv)" },
    { label: "Drop & Inspect", description: "Instant in-browser check before upload" },
    { label: "Server Validation", description: "Ledger check & APAAR registry match" },
    { label: "Approve & Commit", description: "Admin signs off; seats consumed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Data Submission Workflow"
        description="Submit student intake data keyed by 12-digit APAAR ID. Submissions are checked against your approved seat capacity and official registries."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="md">
              <a href="/api/v1/uploads/template">
                <Download className="h-4 w-4" aria-hidden /> {t("downloadTemplate")} (.xlsx)
              </a>
            </Button>
            <Button asChild variant="outline" size="md">
              <a href="/api/v1/uploads/template?format=csv">CSV Format</a>
            </Button>
            <Button asChild variant="ghost" size="md">
              <a href="/samples/demo-upload.xlsx" download>Sample Demo File</a>
            </Button>
          </div>
        }
      />

      {/* Guided 4-Step Timeline */}
      <StepTimeline steps={workflowSteps} currentStep={currentWorkflowStep} />

      {/* Drag & Drop Upload Zone */}
      <Card>
        <CardBody className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) onFile(f);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150",
              drag ? "border-navy bg-navy-light/60 scale-[1.005]" : "border-line bg-page hover:border-navy/40"
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-line text-navy shadow-xs mb-3">
              <UploadCloud className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-base font-bold text-ink">Drag and drop student spreadsheet here</p>
            <p className="mt-1 text-xs text-muted max-w-md leading-relaxed">
              Accepts .xlsx and .csv files up to 5 MB. Validation runs in your browser immediately.
              Nothing is committed until approved by your institutional administrator.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <Button
              size="lg"
              className="mt-5 shadow-xs"
              onClick={() => fileRef.current?.click()}
              loading={busy === "parse"}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden /> Browse Local Files
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Upload Preview & Validation Workspace */}
      {parsed && (
        <Card>
          <CardHeader
            title={`Dataset Preview: ${parsed.fileName}`}
            description={
              <span className="flex flex-wrap items-center gap-2 mt-1">
                <Badge tone="navy">{parsed.rows.length} total rows</Badge>
                <Badge tone={errorRows ? "red" : "green"}>{errorRows} blocking errors</Badge>
                <Badge tone="amber">{warnRows} warnings</Badge>
                {serverChecked ? (
                  <Badge tone="green">
                    <ShieldCheck className="h-3 w-3" aria-hidden /> Registry & Seat Ledger Checked
                  </Badge>
                ) : (
                  <Badge tone="grey">Local checks only</Badge>
                )}
              </span>
            }
            action={
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-navy"
                    checked={errorsOnly}
                    onChange={(e) => setErrorsOnly(e.target.checked)}
                  />
                  <span>Show only rows with issues</span>
                </label>
                <Button variant="secondary" size="sm" onClick={() => helpMeFix()} loading={busy === "assist"}>
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden /> {t("helpMeFix")}
                </Button>
                {!serverChecked ? (
                  <Button size="sm" onClick={validateOnServer} loading={busy === "validate"}>
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Validate & Save Draft
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={submit}
                    loading={busy === "submit"}
                    disabled={parsed.rows.length === errorRows}
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden /> {t("submit")} ({parsed.rows.length - errorRows} valid rows)
                  </Button>
                )}
              </div>
            }
          />

          {/* AI Assisted Error Guidance */}
          {assist && (
            <div className="border-b border-line bg-[#FFFBEF] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-saffron" aria-hidden />
                  <p className="font-bold text-sm text-ink">Smart Error Guidance</p>
                  <Badge tone="grey">{assist.engine === "llm" ? "AI Guidance" : "Guided Hints"}</Badge>
                </div>
                <div className="flex rounded-lg border border-line bg-white p-0.5" role="group">
                  {(["en", "hi"] as const).map((l) => (
                    <button
                      key={l}
                      aria-pressed={assistLang === l}
                      onClick={() => {
                        setAssistLang(l);
                        helpMeFix(l);
                      }}
                      className={cn(
                        "rounded px-2.5 py-0.5 text-xs font-medium transition-colors",
                        assistLang === l ? "bg-navy text-white" : "text-muted hover:text-ink"
                      )}
                    >
                      {l === "en" ? "English" : "हिंदी"}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {assist.items.map((a, i) => (
                  <li key={i} className="rounded-lg border border-line bg-white p-3 text-xs">
                    <p className="font-bold text-ink">{a.explanation}</p>
                    <p className="mt-1 text-muted">Action: <span className="text-[#0E6106] font-medium">{a.fix}</span></p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Records Table */}
          <div className="max-h-[520px] overflow-auto">
            <Table caption="Upload preview data table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="th">Row</th>
                  <th className="th">Validation Status</th>
                  {cols.map((c) => (
                    <th key={c.key} className="th">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(({ r, res }) => {
                  const errorFields = new Set(
                    res?.issues.filter((i) => i.severity !== "low").map((i) => String(i.field))
                  );
                  return (
                    <tr key={res?.rowNumber} className={res?.blocking ? "flagged-row" : "hover:bg-page transition-colors"}>
                      <td className="td text-xs font-mono text-muted">{res?.rowNumber}</td>
                      <td className="td min-w-[240px]">
                        {res?.issues.length ? (
                          <ul className="space-y-1">
                            {res.issues.map((i, n) => (
                              <li key={n} className="flex items-start gap-1.5 text-xs">
                                <SeverityBadge severity={i.severity} />
                                <Tip content={i.fixHint}>
                                  <span tabIndex={0} className="underline decoration-dotted underline-offset-2 cursor-help text-ink">
                                    {i.message}
                                  </span>
                                </Tip>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-4 w-4" aria-hidden /> Ready to Commit
                          </span>
                        )}
                      </td>
                      {cols.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "td whitespace-nowrap text-xs",
                            errorFields.has(c.key) && "bg-[#FDECEC] font-bold text-[#9E1C1C]"
                          )}
                        >
                          {r[c.key] || (errorFields.has(c.key) ? "(empty)" : "")}
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

      {/* Recent Upload Batches & Approval Actions */}
      <Card>
        <CardHeader
          title="Recent Upload History"
          description={
            isAdmin
              ? "As institution administrator, you authorize submitted batches. Valid records consume approved seat ledger tokens."
              : "Submitted uploads require authorization by your institutional administrator."
          }
        />
        {!batches?.items.length ? (
          <EmptyState
            title="No previous uploads found"
            body="Validated drafts and approved submissions will appear here with ledger allocation results."
          />
        ) : (
          <Table caption="Recent upload batches">
            <thead>
              <tr>
                {["File", "Total", "Valid", "Errors", "Status", "Uploader", "Timestamp", "Ledger Outcome", ""].map(
                  (h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {batches.items.map((b) => (
                <tr key={b._id} className="hover:bg-page transition-colors">
                  <td className="td font-semibold text-ink">{b.fileName}</td>
                  <td className="td text-xs font-mono">{b.rowCount}</td>
                  <td className="td text-xs font-mono text-success font-semibold">{b.validRows}</td>
                  <td className="td text-xs font-mono text-danger font-semibold">{b.errorRows}</td>
                  <td className="td">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="td text-xs text-muted">{b.uploadedBy}</td>
                  <td className="td whitespace-nowrap text-xs text-muted">
                    {fmtDate(b.submittedAt ?? b.createdAt, true)}
                  </td>
                  <td className="td text-xs text-muted max-w-[220px]">
                    {b.commitSummary
                      ? `${b.commitSummary.committed} committed · ${b.commitSummary.rejectedBySeatLedger} blocked by ledger · ${b.commitSummary.skippedWithErrors} skipped`
                      : "—"}
                  </td>
                  <td className="td whitespace-nowrap">
                    {isAdmin && b.status === "submitted" && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setConfirm({ id: b._id, action: "approve" })}
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirm({ id: b._id, action: "reject" })}
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Bulk Outcomes Upload */}
      <OutcomesUpload />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "approve" ? "Authorize & Commit Upload Batch?" : "Reject Upload Batch?"}
        body={
          confirm?.action === "approve"
            ? "Valid rows will be inscribed to the AICTE central repository. Each admission consumes one official seat token. Admissions exceeding approved program capacity will be blocked and alerted."
            : "The batch will be rejected without committing any student records to the central repository."
        }
        confirmLabel={confirm?.action === "approve" ? "Authorize & Commit" : "Reject Batch"}
        danger={confirm?.action === "reject"}
        onConfirm={async () => {
          try {
            const r = await api<{
              committed?: number;
              rejectedBySeatLedger?: number;
              skippedWithErrors?: number;
            }>(
              `/api/v1/uploads/${confirm!.id}/approve`,
              "POST",
              { action: confirm!.action },
              { "Idempotency-Key": crypto.randomUUID() }
            );
            if (confirm!.action === "approve") {
              toast.success(`${r.committed} student records committed`, {
                description: `${r.rejectedBySeatLedger} blocked by seat ledger · ${r.skippedWithErrors} skipped with errors`,
              });
              if (r.rejectedBySeatLedger) {
                toast.error("Admissions beyond approved intake were blocked by the ledger. AICTE alert recorded.");
              }
            } else {
              toast.success("Upload batch rejected");
            }
            refreshBatches();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}

function OutcomesUpload() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card className="border border-line">
      <CardHeader
        title="Student Graduate Outcomes Upload"
        description="Submit graduate employment or higher-studies outcomes (Columns: apaarId, type, organisation, year). Disclosed only with student consent."
      />
      <CardBody className="flex flex-wrap items-center gap-3 p-5">
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
              const rows = XLSX.utils
                .sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" })
                .map((r) => ({ ...r, apaarId: String(r.apaarId ?? "") }));
              const r = await api<{ matched: number; invalid: { row: number; error: string }[] }>(
                "/api/v1/outcomes/upload",
                "POST",
                { rows },
                { "Idempotency-Key": crypto.randomUUID() }
              );
              toast.success(`${r.matched} outcome record(s) updated`, {
                description: r.invalid.length ? `${r.invalid.length} invalid row(s) flagged.` : undefined,
              });
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button variant="secondary" onClick={() => ref.current?.click()} loading={busy}>
          <UploadCloud className="h-4 w-4" aria-hidden /> Upload Outcomes File
        </Button>
        <span className="text-xs text-muted">
          Integrates with national placement and higher-education progression analytics.
        </span>
      </CardBody>
    </Card>
  );
}

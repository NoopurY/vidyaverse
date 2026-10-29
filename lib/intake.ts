/** Validate + commit pipeline shared by the single-student form, ERP API and batch approval. */
import { Types } from "mongoose";
import { Institution, ValidationIssue, type InstitutionDoc } from "@/models";
import { getRules } from "./rules";
import { enrolStudent } from "./students";
import { validateRowsServer, type ServerRowIssue } from "./validation/server";
import { isBlocking } from "./validation/rowRules";
import type { StudentRow } from "./validation/schema";
import type { Actor } from "./api";

export type RowOutcome = {
  rowNumber: number;
  apaarId: string;
  status: "committed" | "rejected" | "error";
  issues: ServerRowIssue[];
  message?: string;
  studentId?: string;
};

export async function loadInstitution(id: string) {
  const inst = await Institution.findById(id).lean<InstitutionDoc>();
  if (!inst) throw new Error("Institution not found");
  return inst;
}

/** Persists issues for rows (one ValidationIssue per row issue) */
export async function recordIssues(
  inst: Pick<InstitutionDoc, "_id" | "region">,
  rows: StudentRow[],
  issues: ServerRowIssue[][],
  opts: { batchId?: Types.ObjectId; rowOffset?: number; studentIds?: (string | undefined)[] } = {}
) {
  const docs = issues.flatMap((list, i) =>
    list.map((iss) => ({
      type: iss.type === "format" ? "inconsistency" : iss.type,
      severity: iss.severity,
      studentApaar: rows[i].apaarId || undefined,
      studentId: opts.studentIds?.[i] ? new Types.ObjectId(opts.studentIds[i]) : undefined,
      institutionId: inst._id,
      region: inst.region,
      batchId: opts.batchId,
      rowNumber: (opts.rowOffset ?? 2) + i,
      field: iss.field,
      details: iss.message,
      fixHint: iss.fixHint,
      meta: { ...(iss.meta ?? {}), name: rows[i].name, dob: rows[i].dob, staging: !opts.studentIds?.[i] && iss.type !== "intake_exceeded" },
      status: "open",
    }))
  );
  if (docs.length) await ValidationIssue.insertMany(docs, { ordered: false });
  return docs.length;
}

/** Validates rows and commits the ones without blocking issues through the seat ledger */
export async function processRows(
  rows: StudentRow[],
  inst: InstitutionDoc,
  actor: Actor,
  opts: { batchId?: Types.ObjectId; ip?: string; preValidated?: ServerRowIssue[][] } = {}
): Promise<RowOutcome[]> {
  const rules = await getRules();
  const issues = opts.preValidated ?? (await validateRowsServer(rows, inst, rules, { skipIntake: true }));
  const outcomes: RowOutcome[] = [];
  const committedIds: (string | undefined)[] = [];
  for (let i = 0; i < rows.length; i++) {
    const rowIssues = issues[i];
    if (isBlocking(rowIssues)) {
      outcomes.push({ rowNumber: i + 2, apaarId: rows[i].apaarId, status: "error", issues: rowIssues });
      committedIds.push(undefined);
      continue;
    }
    const r = await enrolStudent(rows[i], inst, actor, { batchId: opts.batchId, ip: opts.ip });
    if (r.ok) {
      outcomes.push({ rowNumber: i + 2, apaarId: rows[i].apaarId, status: "committed", issues: rowIssues, studentId: String(r.student._id) });
      committedIds.push(String(r.student._id));
    } else {
      outcomes.push({ rowNumber: i + 2, apaarId: rows[i].apaarId, status: "rejected", issues: rowIssues, message: r.message });
      committedIds.push(undefined);
    }
  }
  // keep non-blocking warnings (fuzzy duplicates, date anomalies...) and blocking errors as reviewable issues
  const keep = issues.map((list, i) => (outcomes[i].status === "rejected" ? list.filter((x) => x.type !== "intake_exceeded") : list));
  await recordIssues(inst, rows, keep, { batchId: opts.batchId, studentIds: committedIds });
  return outcomes;
}

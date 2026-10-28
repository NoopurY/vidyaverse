import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError, paging, institutionScope, requirePII, escapeRegex } from "@/lib/api";
import { audit } from "@/lib/audit";
import { processRows, loadInstitution } from "@/lib/intake";
import { studentView } from "@/lib/students";
import { StudentRowInput } from "@/lib/validation/input";
import { Institution, Student, ValidationIssue } from "@/models";
import { ISSUE_LABEL } from "@/lib/constants";

/** GET /api/v1/students — paginated, scoped, masked list with flag reasons */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, query, ip }) => {
  requirePII(actor);
  const { page, limit, skip } = paging(query);
  const scope = institutionScope(actor);
  const instIds = (await Institution.find(scope, { _id: 1 }).lean()).map((i) => i._id);
  const match: Record<string, unknown> = { institutionId: { $in: instIds } };
  const instFilter = query.get("institutionId");
  if (instFilter && Types.ObjectId.isValid(instFilter)) {
    if (!instIds.some((i) => String(i) === instFilter)) throw new ApiError(403, "Outside your scope");
    match.institutionId = new Types.ObjectId(instFilter);
  }
  for (const k of ["status", "programId", "academicYear", "seatType", "category"]) {
    const v = query.get(k);
    if (v) match[k] = v;
  }
  const q = query.get("q")?.trim();
  if (q) match.$or = /^\d+$/.test(q) ? [{ apaarId: { $regex: `^${escapeRegex(q)}` } }] : [{ name: { $regex: escapeRegex(q), $options: "i" } }];
  if (query.get("flagged") === "1") {
    const flaggedIds = await ValidationIssue.distinct("studentId", { status: "open", studentId: { $ne: null }, institutionId: match.institutionId });
    match._id = { $in: flaggedIds };
  }
  const [total, rows] = await Promise.all([
    Student.countDocuments(match),
    Student.find(match, { history: 0 }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
  ]);
  const issues = await ValidationIssue.find({ studentId: { $in: rows.map((r) => r._id) }, status: "open" }, { studentId: 1, type: 1, details: 1 }).lean();
  await audit({ actor: actor.email, role: actor.role, action: "student.list_read", entity: "Student", after: { count: rows.length, filters: Object.fromEntries(query) }, ip });
  return {
    page,
    limit,
    total,
    items: rows.map((s) => ({
      ...studentView(s),
      flags: issues.filter((i) => String(i.studentId) === String(s._id)).map((i) => `${ISSUE_LABEL[i.type] ?? i.type}: ${i.details}`),
    })),
  };
});

const Body = z.union([z.object({ student: StudentRowInput }), z.object({ students: z.array(StudentRowInput).min(1).max(1000) })]);

/** POST /api/v1/students — single add (form) or bulk (ERP). Validated, then committed through the seat ledger. */
export const POST = route(
  { roles: ["INSTITUTION"], body: Body, idempotent: true, rate: { name: "students-post", limit: 60, windowSec: 60 } },
  async ({ actor, body, ip }) => {
    const inst = await loadInstitution(actor.institutionId!);
    const rows = "student" in body ? [body.student] : body.students;
    const results = await processRows(rows, inst, actor, { ip });
    const committed = results.filter((r) => r.status === "committed").length;
    if ("student" in body) {
      const r = results[0];
      if (r.status !== "committed")
        throw new ApiError(r.status === "rejected" ? 409 : 422, r.message ?? "Validation failed", { issues: r.issues });
      return { ok: true, studentId: r.studentId, warnings: r.issues };
    }
    return { ok: true, committed, rejected: results.length - committed, results };
  }
);

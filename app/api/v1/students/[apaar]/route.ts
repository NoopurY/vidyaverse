import { z } from "zod";
import { route, ApiError, assertInstitutionAccess, requirePII, institutionScope } from "@/lib/api";
import { audit } from "@/lib/audit";
import { studentView, updateStudent } from "@/lib/students";
import { getRules } from "@/lib/rules";
import { validateRowsServer } from "@/lib/validation/server";
import { normaliseRow } from "@/lib/validation/schema";
import { decrypt } from "@/lib/crypto";
import { Institution, Student, ValidationIssue, Credential } from "@/models";

async function findScoped(apaar: string, actor: Parameters<typeof institutionScope>[0], institutionId?: string | null) {
  const instIds = (await Institution.find(institutionScope(actor), { _id: 1 }).lean()).map((i) => String(i._id));
  const list = await Student.find({ apaarId: apaar });
  const visible = list.filter((s) => instIds.includes(String(s.institutionId)));
  const s = institutionId ? visible.find((x) => String(x.institutionId) === institutionId) : visible.sort((a, b) => (a.status === "active" ? -1 : b.status === "active" ? 1 : 0))[0];
  if (!s) throw new ApiError(404, "Student not found in your scope");
  return s;
}

/** GET /api/v1/students/:apaar — full record (PII revealed to authorised roles; access is audited) */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, params, query, ip }) => {
  requirePII(actor);
  const s = await findScoped(params.apaar, actor, query.get("institutionId"));
  await assertInstitutionAccess(actor, String(s.institutionId));
  const [issues, creds] = await Promise.all([
    ValidationIssue.find({ studentId: s._id }).sort({ createdAt: -1 }).lean(),
    Credential.find({ studentApaar: s.apaarId }, { credentialId: 1, issuedAt: 1, revoked: 1 }).sort({ issuedAt: -1 }).lean(),
  ]);
  await audit({ actor: actor.email, role: actor.role, action: "student.pii_read", entity: "Student", entityId: String(s._id), ip });
  return { student: studentView(s, { reveal: true }), history: s.history.map((h) => ({ version: h.version, changedBy: h.changedBy, changedAt: h.changedAt, diff: h.diff })), issues, credentials: creds };
});

const Patch = z.object({
  name: z.string().min(2).max(120).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["M", "F", "T"]).optional(),
  category: z.enum(["General", "SC", "ST", "OBC", "EWS"]).optional(),
  nationalityStatus: z.enum(["Indian", "NRI", "OCI", "FN"]).optional(),
  seatType: z.enum(["regular", "nri", "oci", "fn", "tfw", "other"]).optional(),
  programId: z.string().max(20).optional(),
  academicYear: z.enum(["2024-25", "2025-26"]).optional(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  counsellingRef: z.string().max(50).optional(),
  status: z.enum(["active", "dropped", "transferred", "graduated"]).optional(),
  institutionStudentId: z.string().max(50).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().optional(),
  parentName: z.string().max(120).optional(),
  outcome: z.object({ type: z.enum(["placement", "higher-studies", "none"]), organisation: z.string().max(120).optional(), year: z.number().int().optional(), consentGiven: z.boolean() }).optional(),
  expectedVersion: z.number().int().optional(),
});

/** PUT /api/v1/students/:apaar — versioned edit with re-validation (optimistic concurrency via expectedVersion) */
export const PUT = route({ roles: ["INSTITUTION"], body: Patch, idempotent: true }, async ({ actor, params, body, ip }) => {
  const s = await findScoped(params.apaar, actor);
  if (body.expectedVersion && body.expectedVersion !== s.version) throw new ApiError(409, `Record changed (now version ${s.version}). Reload and retry.`);
  if (body.status === "transferred") throw new ApiError(400, "Use the Transfers workflow to transfer a student");
  const inst = await Institution.findById(s.institutionId).lean();
  // re-validate the merged record with the same rule engine as uploads
  const merged = normaliseRow({
    apaarId: s.apaarId, institutionStudentId: body.institutionStudentId ?? s.institutionStudentId, name: body.name ?? s.name, dob: body.dob ?? s.dob, gender: body.gender ?? s.gender,
    parentName: body.parentName ?? decrypt(s.parentName), phone: body.phone ?? decrypt(s.phone), email: body.email ?? decrypt(s.email), category: body.category ?? s.category,
    nri: (body.nationalityStatus ?? s.nationalityStatus) === "NRI" ? "Y" : "N", oci: (body.nationalityStatus ?? s.nationalityStatus) === "OCI" ? "Y" : "N",
    foreignNational: (body.nationalityStatus ?? s.nationalityStatus) === "FN" ? "Y" : "N", seatType: body.seatType ?? s.seatType, programId: body.programId ?? s.programId,
    academicYear: body.academicYear ?? s.academicYear, admissionDate: body.admissionDate ?? s.admissionDate, counsellingRef: body.counsellingRef ?? s.counsellingRef, status: body.status ?? s.status,
  });
  const [issues] = await validateRowsServer([merged], inst!, await getRules(), { excludeStudentId: String(s._id), skipIntake: true });
  const blocking = issues.filter((i) => i.severity === "high" && i.type !== "cross_institution_duplicate");
  if (blocking.length) throw new ApiError(422, "Validation failed", { issues: blocking });
  const { expectedVersion: _ignored, ...patch } = body;
  try {
    const r = await updateStudent(s, patch, actor, ip);
    return { ok: true, changed: r.changed, version: r.student.version, warnings: issues };
  } catch (e) {
    throw new ApiError(409, (e as Error).message);
  }
});

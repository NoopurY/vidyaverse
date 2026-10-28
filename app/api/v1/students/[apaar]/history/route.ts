import { route, ApiError, institutionScope, requirePII } from "@/lib/api";
import { audit } from "@/lib/audit";
import { snapshotAsOf } from "@/lib/students";
import { Institution, Student } from "@/models";

/** GET /api/v1/students/:apaar/history?asOf=YYYY-MM-DD — time-travel view of the record */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION", "STUDENT"] }, async ({ actor, params, query, ip }) => {
  let students;
  if (actor.role === "STUDENT") {
    if (actor.studentApaar !== params.apaar) throw new ApiError(403, "Students can only view their own record");
    students = await Student.find({ apaarId: params.apaar });
  } else {
    requirePII(actor);
    const instIds = (await Institution.find(institutionScope(actor), { _id: 1 }).lean()).map((i) => i._id);
    students = await Student.find({ apaarId: params.apaar, institutionId: { $in: instIds } });
  }
  if (!students.length) throw new ApiError(404, "Not found");
  const asOfRaw = query.get("asOf");
  const asOf = asOfRaw ? new Date(asOfRaw.length === 10 ? `${asOfRaw}T23:59:59.999Z` : asOfRaw) : new Date();
  if (isNaN(asOf.getTime())) throw new ApiError(400, "asOf must be a date");
  await audit({ actor: actor.email, role: actor.role, action: "student.history_read", entity: "Student", entityId: params.apaar, after: { asOf }, ip });
  return {
    asOf,
    records: students.map((s) => ({
      institutionId: String(s.institutionId),
      currentVersion: s.version,
      asOf: snapshotAsOf(s, asOf),
      versions: s.history.map((h) => ({ version: h.version, changedAt: h.changedAt, changedBy: h.changedBy, diff: h.diff })),
    })),
  };
});

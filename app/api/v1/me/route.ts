import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { studentView } from "@/lib/students";
import { AuditLog, Consent, Institution, Student, VerificationLog } from "@/models";

export const dynamic = "force-dynamic";

/** GET /api/v1/me — the student's own record (data-rights: view my data + access history) */
export const GET = route({ roles: ["STUDENT"] }, async ({ actor, ip }) => {
  const records = await Student.find({ apaarId: actor.studentApaar }).sort({ updatedAt: -1 });
  if (!records.length) throw new ApiError(404, "No record linked to your APAAR yet");
  const current = records.find((r) => r.status === "active") ?? records.find((r) => r.status === "graduated") ?? records[0];
  const insts = await Institution.find({ _id: { $in: records.map((r) => r.institutionId) } }, { name: 1, aicteId: 1, programs: 1, state: 1 }).lean();
  const instOf = (id: unknown) => insts.find((i) => String(i._id) === String(id));
  const ids = records.map((r) => String(r._id));
  const [verifications, accesses, consents] = await Promise.all([
    VerificationLog.find({ studentApaar: actor.studentApaar }).sort({ timestamp: -1 }).limit(50).lean(),
    AuditLog.find({ entity: "Student", entityId: { $in: ids }, action: { $in: ["student.pii_read", "student.history_read", "verification.consented_read", "certificate.data_read", "student.update", "student.enrol"] } }, { actor: 1, role: 1, action: 1, timestamp: 1 }).sort({ seq: -1 }).limit(50).lean(),
    Consent.find({ dataPrincipal: actor.studentApaar }, { consentId: 1, status: 1, requesterName: 1 }).lean(),
  ]);
  await audit({ actor: actor.email, role: actor.role, action: "student.self_read", entity: "Student", entityId: String(current._id), ip });
  const inst = instOf(current.institutionId);
  const program = inst?.programs.find((p) => p.programId === current.programId);
  return {
    record: { ...studentView(current, { reveal: true }), institution: inst?.name, institutionAicteId: inst?.aicteId, state: inst?.state, programName: program?.name, programLevel: program?.level },
    otherRecords: records.filter((r) => r !== current).map((r) => ({ institution: instOf(r.institutionId)?.name, status: r.status, academicYear: r.academicYear })),
    history: current.history.map((h) => ({ version: h.version, changedAt: h.changedAt, changedBy: h.changedBy, diff: h.diff })),
    accessLog: [
      ...verifications.map((v) => ({ at: v.timestamp, who: v.who?.startsWith("web:") ? "Verifier (web)" : v.who?.startsWith("whatsapp:") ? "Verifier (WhatsApp)" : v.who, what: `Verification – ${v.result}`, channel: v.channel, consentId: v.consentId })),
      ...accesses.map((a) => ({ at: a.timestamp, who: a.role === "VERIFIER" ? "Verifier" : `${a.actor} (${a.role})`, what: a.action, channel: "portal" })),
    ].sort((a, b) => +new Date(b.at as Date) - +new Date(a.at as Date)),
    consentSummary: { pending: consents.filter((c) => c.status === "pending").length, active: consents.filter((c) => c.status === "approved").length },
  };
});

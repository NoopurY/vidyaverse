import { z } from "zod";
import { route, ApiError, institutionScope } from "@/lib/api";
import { audit } from "@/lib/audit";
import { apaarToken, refId } from "@/lib/crypto";
import { notifyTransfer } from "@/lib/transfers";
import { Institution, Student, Transfer } from "@/models";

/** GET /api/v1/transfers — incoming and outgoing transfers for my institution (AICTE: all in scope) */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor }) => {
  const instIds = (await Institution.find(institutionScope(actor), { _id: 1 }).lean()).map((i) => i._id);
  const list = await Transfer.find({ $or: [{ fromInstitutionId: { $in: instIds } }, { toInstitutionId: { $in: instIds } }] }).sort({ createdAt: -1 }).limit(200).lean();
  const names = new Map((await Institution.find({ _id: { $in: list.flatMap((t) => [t.fromInstitutionId, t.toInstitutionId]) } }, { name: 1 }).lean()).map((i) => [String(i._id), i.name]));
  const mine = actor.institutionId;
  return {
    items: list.map((t) => {
      const outgoing = mine ? String(t.fromInstitutionId) === mine : false;
      return {
        id: String(t._id),
        direction: actor.role === "AICTE_ADMIN" ? "—" : outgoing ? "outgoing" : "incoming",
        apaarId: t.apaarId,
        studentName: t.studentName,
        // the requesting institution never learns which institution the student came from
        from: actor.role === "INSTITUTION" && !outgoing ? refId(apaarToken(t.apaarId)) : names.get(String(t.fromInstitutionId)),
        to: names.get(String(t.toInstitutionId)),
        toProgramId: t.toProgramId,
        status: t.status,
        reason: t.reason,
        requestedAt: t.requestedAt,
        releasedAt: t.releasedAt,
        completedAt: t.completedAt,
      };
    }),
  };
});

const Body = z.object({
  apaarId: z.string().regex(/^\d{12}$/),
  studentName: z.string().min(2).max(120),
  toProgramId: z.string().max(20),
  academicYear: z.string().max(10),
  reason: z.string().max(300).optional(),
});

/** POST /api/v1/transfers — the new institution requests a transfer */
export const POST = route({ roles: ["INSTITUTION"], body: Body }, async ({ actor, body, ip }) => {
  const to = await Institution.findById(actor.institutionId).lean();
  if (!to?.programs.some((p) => p.programId === body.toProgramId)) throw new ApiError(400, "Program is not approved for your institution");
  const current = await Student.findOne({ apaarToken: apaarToken(body.apaarId), status: "active" }, { institutionId: 1, name: 1 }).lean();
  if (!current) throw new ApiError(404, "No active enrolment found for this APAAR; add the student directly instead");
  if (String(current.institutionId) === actor.institutionId) throw new ApiError(400, "Student is already enrolled at your institution");
  if (await Transfer.exists({ apaarId: body.apaarId, status: { $in: ["requested", "released"] } })) throw new ApiError(409, "A transfer is already in progress for this student");
  const t = await Transfer.create({
    apaarId: body.apaarId,
    studentName: body.studentName,
    fromInstitutionId: current.institutionId,
    toInstitutionId: to._id,
    toProgramId: body.toProgramId,
    academicYear: body.academicYear,
    reason: body.reason,
    status: "requested",
    requestedAt: new Date(),
  });
  await audit({ actor: actor.email, role: actor.role, action: "transfer.request", entity: "Transfer", entityId: String(t._id), after: { toProgramId: body.toProgramId }, ip });
  await notifyTransfer(t, "requested");
  return { ok: true, id: String(t._id), message: `Request sent to the current institution (${refId(apaarToken(body.apaarId))})` };
});

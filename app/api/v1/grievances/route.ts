import { z } from "zod";
import { route, institutionScope } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getWhatsApp } from "@/lib/whatsapp/adapter";
import { Grievance, Institution, Student } from "@/models";
import { ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/grievances — student: own; institution: own institution; AICTE: scoped */
export const GET = route({ roles: ["STUDENT", "INSTITUTION", "AICTE_ADMIN"] }, async ({ actor }) => {
  let match: Record<string, unknown>;
  if (actor.role === "STUDENT") match = { studentApaar: actor.studentApaar };
  else match = { institutionId: { $in: (await Institution.find(institutionScope(actor), { _id: 1 }).lean()).map((i) => i._id) } };
  const items = await Grievance.find(match).sort({ createdAt: -1 }).limit(200).lean();
  return { items };
});

const Body = z.object({
  field: z.enum(["name", "dob", "gender", "category", "programId", "admissionDate", "status", "phone", "email", "parentName", "other"]),
  currentValue: z.string().max(200).optional(),
  requestedValue: z.string().min(1).max(200),
  reason: z.string().min(5).max(500),
});

/** POST /api/v1/grievances — student requests a correction (data-rights) */
export const POST = route({ roles: ["STUDENT"], body: Body }, async ({ actor, body, ip }) => {
  const s = await Student.findOne({ apaarId: actor.studentApaar }).sort({ status: 1, updatedAt: -1 }).lean();
  if (!s) throw new ApiError(404, "Record not found");
  const g = await Grievance.create({ ...body, studentApaar: actor.studentApaar, institutionId: s.institutionId, status: "open" });
  const inst = await Institution.findById(s.institutionId, { contactPhone: 1 }).lean();
  if (inst?.contactPhone) await getWhatsApp().send(inst.contactPhone, `📝 New correction request from a student (${body.field}). Please review it in VidyaVerse → Students.`);
  await audit({ actor: actor.email, role: actor.role, action: "grievance.create", entity: "Grievance", entityId: String(g._id), after: { field: body.field }, ip });
  return { ok: true, id: String(g._id) };
});

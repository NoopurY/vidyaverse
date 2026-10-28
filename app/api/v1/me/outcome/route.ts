import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { updateStudent } from "@/lib/students";
import { Student } from "@/models";

export const dynamic = "force-dynamic";

const Body = z.object({
  type: z.enum(["placement", "higher-studies", "none"]),
  organisation: z.string().max(120).optional(),
  year: z.number().int().min(2015).max(2035).optional(),
  consentGiven: z.boolean(),
});

/** POST /api/v1/me/outcome — student records a placement / higher-studies outcome (with consent to include it) */
export const POST = route({ roles: ["STUDENT"], body: Body }, async ({ actor, body, ip }) => {
  if (body.type !== "none" && (!body.organisation || !body.year)) throw new ApiError(422, "Organisation and year are required");
  const s = (await Student.findOne({ apaarId: actor.studentApaar, status: { $in: ["active", "graduated"] } }).sort({ updatedAt: -1 })) ?? (await Student.findOne({ apaarId: actor.studentApaar }));
  if (!s) throw new ApiError(404, "Record not found");
  await updateStudent(s, { outcome: body }, actor, ip);
  return { ok: true };
});

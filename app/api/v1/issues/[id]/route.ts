import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError, assertInstitutionAccess } from "@/lib/api";
import { audit } from "@/lib/audit";
import { recomputeRisk } from "@/lib/checks";
import { ValidationIssue } from "@/models";

const Body = z.object({
  action: z.enum(["resolve", "override", "same-person", "different-person"]),
  note: z.string().max(300).optional(),
});

/** PATCH /api/v1/issues/:id — resolve / override, or decide a fuzzy duplicate (AICTE) */
export const PATCH = route(
  { roles: ["AICTE_ADMIN", "INSTITUTION"], perms: { AICTE_ADMIN: ["full", "regional"] }, body: Body },
  async ({ actor, params, body, ip }) => {
    if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
    const issue = await ValidationIssue.findById(params.id);
    if (!issue) throw new ApiError(404, "Issue not found");
    await assertInstitutionAccess(actor, String(issue.institutionId));
    const dupDecision = body.action === "same-person" || body.action === "different-person";
    if (dupDecision && (actor.role !== "AICTE_ADMIN" || issue.type !== "fuzzy_duplicate")) throw new ApiError(403, "Only AICTE can decide duplicate reviews");
    if (body.action === "override" && actor.role !== "AICTE_ADMIN") throw new ApiError(403, "Only AICTE can override a flag");
    const before = { status: issue.status, resolution: issue.resolution };
    issue.status = body.action === "override" || body.action === "different-person" ? "overridden" : "resolved";
    issue.resolution = body.action === "same-person" ? "Confirmed same person – duplicate record must be removed" : body.action === "different-person" ? "Confirmed different persons" : body.note ?? body.action;
    issue.resolvedBy = actor.email;
    await issue.save();
    if (body.action === "same-person")
      await ValidationIssue.create({
        type: "duplicate_in_institution",
        severity: "high",
        institutionId: issue.institutionId,
        region: issue.region,
        studentApaar: issue.studentApaar,
        studentId: issue.studentId,
        details: "AICTE confirmed this is the same person as an existing record. Remove the duplicate enrolment.",
        fixHint: "Drop the duplicate record from Students and keep the original APAAR.",
        status: "open",
      });
    await audit({ actor: actor.email, role: actor.role, action: `issue.${body.action}`, entity: "ValidationIssue", entityId: params.id, before, after: { status: issue.status, resolution: issue.resolution }, ip });
    await recomputeRisk();
    return { ok: true, status: issue.status };
  }
);

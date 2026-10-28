import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError, assertInstitutionAccess } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Grievance } from "@/models";

const Body = z.object({ action: z.enum(["institution-fixed", "aicte-approved", "rejected"]), remarks: z.string().max(300).optional() });

/** PATCH /api/v1/grievances/:id — institution marks fixed; AICTE approves; either may reject with remarks */
export const PATCH = route(
  { roles: ["INSTITUTION", "AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] }, body: Body },
  async ({ actor, params, body, ip }) => {
    if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
    const g = await Grievance.findById(params.id);
    if (!g) throw new ApiError(404, "Grievance not found");
    await assertInstitutionAccess(actor, String(g.institutionId));
    if (body.action === "aicte-approved" && actor.role !== "AICTE_ADMIN") throw new ApiError(403, "Only AICTE can approve");
    if (body.action === "institution-fixed" && actor.role !== "INSTITUTION") throw new ApiError(403, "Only the institution can mark fixed");
    const before = g.status;
    g.status = body.action;
    g.remarks = body.remarks;
    await g.save();
    await audit({ actor: actor.email, role: actor.role, action: `grievance.${body.action}`, entity: "Grievance", entityId: params.id, before: { status: before }, after: { status: g.status }, ip });
    return { ok: true, status: g.status };
  }
);

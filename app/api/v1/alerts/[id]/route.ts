import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Alert } from "@/models";

export const dynamic = "force-dynamic";

const Body = z.object({ action: z.enum(["acknowledge", "resolve"]) });

/** PATCH /api/v1/alerts/:id — acknowledge or resolve */
export const PATCH = route(
  { roles: ["AICTE_ADMIN", "INSTITUTION"], perms: { AICTE_ADMIN: ["full", "regional"] }, body: Body },
  async ({ actor, params, body, ip }) => {
    if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
    const a = await Alert.findById(params.id);
    if (!a) throw new ApiError(404, "Alert not found");
    if (actor.role === "INSTITUTION" && String(a.institutionId) !== actor.institutionId) throw new ApiError(403, "Not your alert");
    if (actor.permission === "regional" && a.region && a.region !== actor.region) throw new ApiError(403, "Outside your region");
    const before = a.status;
    if (body.action === "acknowledge") {
      a.status = "acknowledged";
      a.acknowledgedBy = actor.email;
      a.acknowledgedAt = new Date();
    } else {
      a.status = "resolved";
      a.resolvedBy = actor.email;
    }
    await a.save();
    await audit({ actor: actor.email, role: actor.role, action: `alert.${body.action}`, entity: "Alert", entityId: params.id, before: { status: before }, after: { status: a.status }, ip });
    return { ok: true, status: a.status };
  }
);

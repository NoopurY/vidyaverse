import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { completeTransfer, notifyTransfer, releaseTransfer } from "@/lib/transfers";
import { Transfer } from "@/models";

export const dynamic = "force-dynamic";

const Body = z.object({ action: z.enum(["release", "complete", "reject"]) });

/** PATCH /api/v1/transfers/:id — release (old institution), complete (new institution) or reject */
export const PATCH = route({ roles: ["INSTITUTION"], body: Body }, async ({ actor, params, body, ip }) => {
  if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
  const t = await Transfer.findById(params.id);
  if (!t) throw new ApiError(404, "Transfer not found");
  const isFrom = String(t.fromInstitutionId) === actor.institutionId;
  const isTo = String(t.toInstitutionId) === actor.institutionId;
  if (!isFrom && !isTo) throw new ApiError(403, "Not your transfer");
  const before = t.status;
  try {
    if (body.action === "release") {
      if (!isFrom || t.status !== "requested") throw new ApiError(409, "Only the current institution can release a requested transfer");
      await releaseTransfer(t, actor, ip);
      t.status = "released";
      t.releasedAt = new Date();
    } else if (body.action === "complete") {
      if (!isTo || t.status !== "released") throw new ApiError(409, "The new institution can complete only after release");
      await completeTransfer(t, actor, ip);
      t.status = "completed";
      t.completedAt = new Date();
    } else {
      if (!["requested", "released"].includes(t.status!)) throw new ApiError(409, `Transfer is ${t.status}`);
      if (t.status === "released") throw new ApiError(409, "Already released; complete the transfer or contact AICTE");
      t.status = "rejected";
      t.rejectedAt = new Date();
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(409, (e as Error).message);
  }
  await t.save();
  await audit({ actor: actor.email, role: actor.role, action: `transfer.${body.action}`, entity: "Transfer", entityId: String(t._id), before: { status: before }, after: { status: t.status }, ip });
  await notifyTransfer(t, t.status as "released" | "completed" | "rejected");
  return { ok: true, status: t.status };
});

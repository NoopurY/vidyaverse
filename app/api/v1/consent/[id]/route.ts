import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { decideConsent } from "@/lib/consent";
import { Consent } from "@/models";

const Body = z.object({ action: z.enum(["approve", "reject", "revoke"]), noticeAccepted: z.boolean().optional() });

/** PATCH /api/v1/consent/:id — student approves, rejects or revokes (effective immediately) */
export const PATCH = route({ roles: ["STUDENT"], body: Body }, async ({ actor, params, body }) => {
  const c = await Consent.findOne({ consentId: params.id, dataPrincipal: actor.studentApaar });
  if (!c) throw new ApiError(404, "Consent not found");
  if (body.action === "approve" && !body.noticeAccepted) throw new ApiError(400, "Please read and accept the consent notice first");
  try {
    await decideConsent(c, body.action, actor.email, "web");
  } catch (e) {
    throw new ApiError(409, (e as Error).message);
  }
  return { ok: true, status: c.status, code: body.action === "approve" ? c.code : undefined };
});

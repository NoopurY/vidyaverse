import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { requestConsent } from "@/lib/consent";
import { DEFAULT_DISCLOSED, DISCLOSABLE_FIELDS } from "@/lib/constants";
import { env } from "@/lib/env";

const Body = z.object({
  requesterName: z.string().min(2).max(120).default("Anyone with this link"),
  purpose: z.enum(["employment", "higher-studies", "regulatory", "other"]).default("employment"),
  fieldsAllowed: z.array(z.enum(DISCLOSABLE_FIELDS)).min(1).default(DEFAULT_DISCLOSED as never),
  validDays: z.number().int().min(1).max(30).default(7),
  noticeAccepted: z.literal(true),
});

/** POST /api/v1/consent/share — student proactively creates an approved consent + shareable verification link */
export const POST = route({ roles: ["STUDENT"], body: Body }, async ({ actor, body }) => {
  const c = await requestConsent(
    { apaarId: actor.studentApaar!, requesterName: body.requesterName, requesterContact: "shared-link", requesterType: "other", purpose: body.purpose, fieldsAllowed: body.fieldsAllowed, frequency: "until-expiry", validDays: body.validDays },
    actor.email,
    "web",
    true
  );
  if (!c) throw new ApiError(404, "Record not found");
  return { consentId: c.consentId, code: c.code, expiresAt: c.expiresAt, link: `${env.appUrl}/verify?apaar=${actor.studentApaar}&code=${c.code}` };
});

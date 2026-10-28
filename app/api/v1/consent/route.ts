import { NextRequest } from "next/server";
import { publicRoute, route } from "@/lib/api";
import { ConsentRequestInput, requestConsent } from "@/lib/consent";
import { Consent } from "@/models";

/** POST /api/v1/consent — a verifier (employer, institution, regulator) requests consent; no login, rate-limited */
export const POST = publicRoute({ body: ConsentRequestInput, rate: { name: "consent-request", limit: 5, windowSec: 300 } }, async ({ body }) => {
  const c = await requestConsent(body, `verifier:${body.requesterContact}`);
  // identical response whether or not the APAAR exists (prevents record enumeration)
  return {
    ok: true,
    message: "If the APAAR is registered, the student has been asked for consent in the portal and on WhatsApp. Once approved, verify using the APAAR and the 6-digit consent code the student shares with you.",
    ...(c ? { consentId: c.consentId } : { consentId: `CNS-${Math.random().toString(16).slice(2, 10).toUpperCase()}` }),
  };
});

/** GET /api/v1/consent — the logged-in student's consents */
const list = route({ roles: ["STUDENT"] }, async ({ actor }) => {
  const items = await Consent.find({ dataPrincipal: actor.studentApaar }).sort({ createdAt: -1 }).lean();
  return { items: items.map(({ signature, ...c }) => ({ ...c, signed: !!signature })) };
});
export const GET = (req: NextRequest, ctx: { params: Record<string, string> }) => list(req, ctx);

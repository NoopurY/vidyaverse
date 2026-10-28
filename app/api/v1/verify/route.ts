import { z } from "zod";
import { publicRoute, ApiError } from "@/lib/api";
import { verifyWithConsent } from "@/lib/consent";
import { verifyPresentation } from "@/lib/vc/issue";
import { VerificationLog } from "@/models";

const Body = z.union([
  z.object({ apaarId: z.string().regex(/^\d{12}$/, "APAAR must be 12 digits"), code: z.string().regex(/^\d{6}$/, "Consent code must be 6 digits") }),
  z.object({ credential: z.string().min(20).max(20000) }),
]);

/** POST /api/v1/verify — consent-gated verification (APAAR + code) or credential (QR) verification. Public, rate-limited, logged. */
export const POST = publicRoute({ body: Body, rate: { name: "verify", limit: 20, windowSec: 60 } }, async ({ body, ip }) => {
  if ("credential" in body) {
    const token = body.credential.includes("vc=") ? decodeURIComponent(body.credential.split("vc=")[1]) : body.credential.trim();
    const result = await verifyPresentation(token).catch(() => null);
    if (!result) throw new ApiError(400, "This is not a valid VidyaVerse credential");
    await VerificationLog.create({ who: `web:${ip}`, channel: "qr", studentApaar: String(result.disclosed.apaarId ?? "undisclosed"), result: result.valid ? "verified" : "failed-checks" });
    return { ok: true, mode: "credential", result };
  }
  const r = await verifyWithConsent(body.apaarId, body.code, `web:${ip}`, "web");
  if (!r.ok) return { ok: false, reason: r.reason };
  return { ok: true, mode: "consent", consent: r.consent, result: r.result, presentation: r.presentation };
});

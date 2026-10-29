import { randomBytes } from "crypto";
import { route, assertInstitutionAccess } from "@/lib/api";
import { audit } from "@/lib/audit";
import { sha256 } from "@/lib/crypto";
import { Institution } from "@/models";

export const dynamic = "force-dynamic";

/** POST /api/v1/institutions/:id/credentials — rotate ERP OAuth client, API key and webhook secret (shown once) */
export const POST = route({ roles: ["INSTITUTION"], perms: { INSTITUTION: ["admin"] } }, async ({ actor, params, ip }) => {
  await assertInstitutionAccess(actor, params.id);
  const inst = await Institution.findById(params.id, { aicteId: 1 }).lean();
  const clientId = `vv-${inst!.aicteId.toLowerCase()}-${randomBytes(3).toString("hex")}`;
  const clientSecret = randomBytes(24).toString("base64url");
  const prefix = randomBytes(4).toString("hex");
  const apiKey = `vv_${prefix}_${randomBytes(24).toString("base64url")}`;
  const webhookSecret = randomBytes(24).toString("hex");
  await Institution.updateOne(
    { _id: params.id },
    { $set: { apiClientId: clientId, apiClientSecretHash: sha256(clientSecret), apiKeyHash: sha256(apiKey), apiKeyPrefix: prefix, webhookSecret } }
  );
  await audit({ actor: actor.email, role: actor.role, action: "institution.api_credentials_rotated", entity: "Institution", entityId: params.id, after: { clientId, apiKeyPrefix: prefix }, ip });
  return { clientId, clientSecret, apiKey, webhookSecret, note: "Store these now. Secrets are shown only once." };
});

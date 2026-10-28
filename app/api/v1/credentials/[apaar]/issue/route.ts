import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { issueCredential } from "@/lib/vc/issue";
import { studentForActor } from "@/lib/studentAccess";

export const dynamic = "force-dynamic";

/** POST /api/v1/credentials/:apaar/issue — (re)issue the W3C VC; previous credentials are revoked */
export const POST = route({ roles: ["AICTE_ADMIN", "INSTITUTION", "STUDENT"] }, async ({ actor, params, ip }) => {
  const s = await studentForActor(actor, params.apaar);
  const c = await issueCredential(s);
  await audit({ actor: actor.email, role: actor.role, action: "credential.issue", entity: "Credential", entityId: c.credentialId, after: { statusListIndex: c.statusListIndex }, ip });
  return { credentialId: c.credentialId, vcJwt: c.vcJwt, sdJwt: c.sdJwt, issuedAt: c.issuedAt, expiresAt: c.expiresAt };
});

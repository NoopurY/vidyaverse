import { route } from "@/lib/api";
import { audit, verifyChain } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET /api/v1/audit/verify-chain — recomputes the SHA-256 hash chain end to end */
export const GET = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] } }, async ({ actor, ip }) => {
  const r = await verifyChain();
  await audit({ actor: actor.email, role: actor.role, action: "audit.verify_chain", entity: "AuditLog", after: { intact: r.intact, checked: r.checked }, ip });
  return r;
});

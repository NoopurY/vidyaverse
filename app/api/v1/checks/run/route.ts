import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { runAllChecks } from "@/lib/checks";
import { expireConsents } from "@/lib/consent";

/** POST /api/v1/checks/run — "Run checks now": all fraud checks + risk recompute + consent expiry */
export const POST = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] }, rate: { name: "checks", limit: 6, windowSec: 60 } }, async ({ actor, ip }) => {
  const started = Date.now();
  const result = { ...(await runAllChecks()), consents: await expireConsents() };
  await audit({ actor: actor.email, role: actor.role, action: "checks.run", entity: "System", after: result, ip });
  return { ok: true, ms: Date.now() - started, result };
});

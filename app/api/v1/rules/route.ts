import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getRules, RulesInput } from "@/lib/rules";
import { recomputeRisk } from "@/lib/checks";
import { Rules } from "@/models";

export const dynamic = "force-dynamic";

export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async () => getRules());

/** PUT /api/v1/rules — AICTE HQ edits the rules engine; every change is audited and risk is recomputed */
export const PUT = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full"] }, body: RulesInput }, async ({ actor, body, ip }) => {
  const before = await getRules();
  await Rules.updateOne({ key: "global" }, { $set: { ...body, updatedBy: actor.email } }, { upsert: true });
  await audit({ actor: actor.email, role: actor.role, action: "rules.update", entity: "Rules", entityId: "global", before, after: body, ip });
  await recomputeRisk(body);
  return { ok: true, rules: body };
});

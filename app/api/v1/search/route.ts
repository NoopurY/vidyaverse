import { z } from "zod";
import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { institutionMetrics, scopedInstitutions } from "@/lib/analytics";
import { parseQuery, SearchFilter } from "@/lib/search";

const Body = z.object({ query: z.string().min(2).max(500).optional(), filter: SearchFilter.optional() });

/** POST /api/v1/search — natural language → whitelisted filter → institutions table */
export const POST = route({ roles: ["AICTE_ADMIN"], body: Body, rate: { name: "nl-search", limit: 30, windowSec: 60 } }, async ({ actor, body, ip }) => {
  const parsed = body.filter ? { filter: body.filter, engine: "manual" as const } : await parseQuery(body.query ?? "");
  const f = parsed.filter;
  const insts = await scopedInstitutions(actor, { state: f.state, region: f.region, institutionType: f.institutionType, discipline: f.discipline });
  let rows = await institutionMetrics(insts, { year: f.academicYear, discipline: f.discipline });
  if (f.exceedingIntake) rows = rows.filter((r) => r.fillPct >= 100 || (r.flagsByType["intake_exceeded"] ?? 0) > 0 || r.riskReasons.some((x) => /beyond approved intake/.test(x)));
  if (f.nearLimit) rows = rows.filter((r) => r.fillPct >= 90);
  if (f.minRiskScore !== undefined) rows = rows.filter((r) => r.riskScore >= f.minRiskScore!);
  if (f.badge) rows = rows.filter((r) => r.badge === f.badge);
  if (f.flagType) rows = rows.filter((r) => (r.flagsByType[f.flagType!] ?? 0) > 0);
  rows.sort((a, b) => b.riskScore - a.riskScore);
  await audit({ actor: actor.email, role: actor.role, action: "search.nl", entity: "Search", after: { query: body.query, filter: f, engine: parsed.engine }, ip });
  return {
    engine: parsed.engine,
    filter: f,
    items: rows.map((r) => ({ id: r.id, name: r.name, aicteId: r.aicteId, state: r.state, type: r.type, intake: r.intake, enrolled: r.enrolled, fillPct: r.fillPct, riskScore: r.riskScore, badge: r.badge, openFlags: r.openFlags, topReason: r.riskReasons[0] })),
  };
});

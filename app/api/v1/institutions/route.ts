import { route, paging, escapeRegex } from "@/lib/api";
import { filtersFrom, institutionMetrics, scopedInstitutions } from "@/lib/analytics";

/** GET /api/v1/institutions — scoped list with live metrics, filters and pagination */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, query }) => {
  const f = filtersFrom(query);
  let insts = await scopedInstitutions(actor, f);
  const q = query.get("q")?.trim();
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    insts = insts.filter((i) => re.test(i.name) || re.test(i.aicteId) || re.test(i.district ?? ""));
  }
  let rows = await institutionMetrics(insts, f);
  const badge = query.get("badge");
  if (badge) rows = rows.filter((r) => r.badge === badge);
  const sort = query.get("sort") ?? "risk";
  rows.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "fill" ? b.fillPct - a.fillPct : b.riskScore - a.riskScore));
  const { skip, limit, page } = paging(query, 200);
  return { total: rows.length, page, limit, items: rows.slice(skip, skip + limit) };
});

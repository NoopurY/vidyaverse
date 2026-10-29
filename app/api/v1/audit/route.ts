import { route, paging, escapeRegex } from "@/lib/api";
import { AuditLog } from "@/models";

export const dynamic = "force-dynamic";

/** GET /api/v1/audit — append-only audit log (read-only; there are no update/delete routes) */
export const GET = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] } }, async ({ query }) => {
  const { skip, limit, page } = paging(query, 100);
  const match: Record<string, unknown> = {};
  if (query.get("action")) match.action = { $regex: `^${escapeRegex(query.get("action")!)}` };
  if (query.get("actor")) match.actor = { $regex: escapeRegex(query.get("actor")!), $options: "i" };
  if (query.get("entityId")) match.entityId = query.get("entityId");
  const [items, total] = await Promise.all([AuditLog.find(match).sort({ seq: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(match)]);
  return { items, total, page, limit };
});

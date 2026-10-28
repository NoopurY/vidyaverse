import { route, paging } from "@/lib/api";
import { Alert } from "@/models";

/** GET /api/v1/alerts — scoped alerts feed (polled every 10s by dashboards and the bell) */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, query }) => {
  const match: Record<string, unknown> = {};
  if (actor.role === "INSTITUTION") match.institutionId = actor.institutionId;
  else if (actor.permission === "regional") match.$or = [{ region: actor.region }, { region: null }];
  if (query.get("status")) match.status = query.get("status");
  if (query.get("severity")) match.severity = query.get("severity");
  if (query.get("type")) match.type = query.get("type");
  const { skip, limit, page } = paging(query, 100);
  const [items, total, unread] = await Promise.all([
    Alert.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(match),
    Alert.countDocuments({ ...match, status: "open" }),
  ]);
  return { items, total, unread, page, limit };
});

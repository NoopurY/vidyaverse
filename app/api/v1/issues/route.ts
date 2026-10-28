import { route, paging, institutionScope, canSeePII } from "@/lib/api";
import { Institution, Student, ValidationIssue } from "@/models";
import { maskApaar } from "@/lib/utils";

/** GET /api/v1/issues — validation issues / flags (scoped). type=fuzzy_duplicate powers the duplicate review. */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, query }) => {
  const insts = await Institution.find(institutionScope(actor), { name: 1 }).lean();
  const names = new Map(insts.map((i) => [String(i._id), i.name]));
  const match: Record<string, unknown> = { institutionId: { $in: insts.map((i) => i._id) } };
  for (const k of ["type", "severity", "status"]) if (query.get(k)) match[k] = query.get(k);
  if (!query.get("status")) match.status = "open";
  if (query.get("institutionId")) match.institutionId = insts.find((i) => String(i._id) === query.get("institutionId"))?._id ?? null;
  const { skip, limit, page } = paging(query, 100);
  const [items, total, byType] = await Promise.all([
    ValidationIssue.find(match).sort({ severity: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ValidationIssue.countDocuments(match),
    ValidationIssue.aggregate([{ $match: { ...match, type: { $exists: true } } }, { $group: { _id: "$type", n: { $sum: 1 } } }]),
  ]);
  const pii = canSeePII(actor);
  // duplicate review needs both candidate records side by side
  let candidates = new Map<string, { name: string; dob: string; institution?: string; apaarId: string }>();
  const candIds = items.map((i) => (i.meta as { candidateId?: string } | undefined)?.candidateId).filter((x): x is string => !!x && /^[a-f0-9]{24}$/.test(x));
  if (candIds.length && pii) {
    const cs = await Student.find({ _id: { $in: candIds } }, { name: 1, dob: 1, institutionId: 1, apaarId: 1 }).lean();
    const instNames = new Map((await Institution.find({ _id: { $in: cs.map((c) => c.institutionId) } }, { name: 1 }).lean()).map((i) => [String(i._id), i.name]));
    candidates = new Map(cs.map((c) => [String(c._id), { name: c.name, dob: c.dob, apaarId: maskApaar(c.apaarId), institution: actor.role === "AICTE_ADMIN" ? instNames.get(String(c.institutionId)) : undefined }]));
  }
  return {
    total,
    page,
    limit,
    byType: Object.fromEntries(byType.map((x) => [x._id, x.n])),
    items: items.map((i) => ({
      ...i,
      institutionName: names.get(String(i.institutionId)),
      studentApaar: pii ? i.studentApaar : maskApaar(i.studentApaar),
      meta: pii ? i.meta : undefined,
      candidate: candidates.get((i.meta as { candidateId?: string } | undefined)?.candidateId ?? ""),
    })),
  };
});

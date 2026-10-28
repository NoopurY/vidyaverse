import { z } from "zod";
import { route, ApiError, assertInstitutionAccess, canSeePII } from "@/lib/api";
import { audit } from "@/lib/audit";
import { institutionMetrics } from "@/lib/analytics";
import { ledgerSummary } from "@/lib/ledger";
import { AuditLog, Institution, Transfer, ValidationIssue, Grievance, Alert, UploadBatch } from "@/models";
import { CURRENT_YEAR } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET /api/v1/institutions/:id — programs, seat ledger, issues, risk reasons, pending items, audit trail */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, params, query }) => {
  await assertInstitutionAccess(actor, params.id);
  const inst = await Institution.findById(params.id, { apiClientSecretHash: 0, apiKeyHash: 0, webhookSecret: 0 }).lean();
  if (!inst) throw new ApiError(404, "Institution not found");
  const year = query.get("year") ?? CURRENT_YEAR;
  const [metrics] = await institutionMetrics([inst], { year });
  const [ledger, issues, issueCounts, audits, pendingTransfers, openGrievances, alerts, pendingUploads] = await Promise.all([
    ledgerSummary({ institutionId: inst._id, academicYear: year }),
    canSeePII(actor) ? ValidationIssue.find({ institutionId: inst._id, status: "open" }).sort({ severity: 1, createdAt: -1 }).limit(100).lean() : [],
    ValidationIssue.aggregate([{ $match: { institutionId: inst._id, status: "open" } }, { $group: { _id: "$type", n: { $sum: 1 } } }]),
    AuditLog.find({ $or: [{ entity: "Institution", entityId: String(inst._id) }, { actor: { $regex: `^erp:${inst._id}` } }] }, { before: 0, after: 0 }).sort({ seq: -1 }).limit(30).lean(),
    Transfer.countDocuments({ $or: [{ fromInstitutionId: inst._id, status: "requested" }, { toInstitutionId: inst._id, status: "released" }] }),
    Grievance.countDocuments({ institutionId: inst._id, status: "open" }),
    Alert.find({ institutionId: inst._id }).sort({ createdAt: -1 }).limit(10).lean(),
    UploadBatch.countDocuments({ institutionId: inst._id, status: "submitted" }),
  ]);
  return {
    institution: { ...inst, hasApiCredentials: !!inst.apiClientId },
    metrics,
    ledger,
    issues,
    issueCounts: Object.fromEntries(issueCounts.map((x) => [x._id, x.n])),
    audit: audits,
    pending: {
      openIssues: issueCounts.reduce((a, x) => a + x.n, 0),
      transfers: pendingTransfers,
      counsellingMismatches: issueCounts.find((x) => x._id === "no_counselling")?.n ?? 0,
      grievances: openGrievances,
      uploadsAwaitingApproval: pendingUploads,
    },
    alerts,
  };
});

const Patch = z.object({
  contactPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  webhookUrl: z.string().url().max(300).or(z.literal("")).optional(),
  address: z.string().max(300).optional(),
});

/** PATCH /api/v1/institutions/:id — institution admin settings (contact phone, webhook URL) */
export const PATCH = route({ roles: ["INSTITUTION"], perms: { INSTITUTION: ["admin"] }, body: Patch }, async ({ actor, params, body, ip }) => {
  await assertInstitutionAccess(actor, params.id);
  const before = await Institution.findById(params.id, { contactPhone: 1, webhookUrl: 1, address: 1 }).lean();
  await Institution.updateOne({ _id: params.id }, { $set: body });
  await audit({ actor: actor.email, role: actor.role, action: "institution.settings_update", entity: "Institution", entityId: params.id, before, after: body, ip });
  return { ok: true };
});

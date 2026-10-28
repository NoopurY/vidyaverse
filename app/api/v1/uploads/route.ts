import { z } from "zod";
import { route, paging } from "@/lib/api";
import { audit } from "@/lib/audit";
import { encryptJson } from "@/lib/crypto";
import { loadInstitution } from "@/lib/intake";
import { getRules } from "@/lib/rules";
import { validateRowsServer } from "@/lib/validation/server";
import { isBlocking } from "@/lib/validation/rowRules";
import { StudentRowInput } from "@/lib/validation/input";
import { UploadBatch } from "@/models";

const Body = z.object({ fileName: z.string().max(200), rows: z.array(StudentRowInput).min(1).max(5000) });

/** POST /api/v1/uploads — validate only; stores a draft batch (rows encrypted at rest) with per-row results */
export const POST = route(
  { roles: ["INSTITUTION"], body: Body, idempotent: true, rate: { name: "uploads", limit: 30, windowSec: 60 } },
  async ({ actor, body, ip }) => {
    const inst = await loadInstitution(actor.institutionId!);
    const issues = await validateRowsServer(body.rows, inst, await getRules());
    const results = body.rows.map((r, i) => ({ rowNumber: i + 2, apaarId: r.apaarId, name: r.name, issues: issues[i], blocking: isBlocking(issues[i]) }));
    const errorRows = results.filter((r) => r.blocking).length;
    const batch = await UploadBatch.create({
      institutionId: inst._id,
      uploadedBy: actor.email,
      fileName: body.fileName,
      rowCount: body.rows.length,
      validRows: body.rows.length - errorRows,
      errorRows,
      rowsEnc: encryptJson(body.rows),
      results,
      status: "draft",
    });
    await audit({ actor: actor.email, role: actor.role, action: "upload.validate", entity: "UploadBatch", entityId: String(batch._id), after: { rows: body.rows.length, errorRows }, ip });
    return { batchId: String(batch._id), rowCount: batch.rowCount, validRows: batch.validRows, errorRows, results };
  }
);

/** GET /api/v1/uploads — batches of my institution */
export const GET = route({ roles: ["INSTITUTION"] }, async ({ actor, query }) => {
  const { skip, limit, page } = paging(query);
  const match: Record<string, unknown> = { institutionId: actor.institutionId };
  if (query.get("status")) match.status = query.get("status");
  const [total, items] = await Promise.all([
    UploadBatch.countDocuments(match),
    UploadBatch.find(match, { rowsEnc: 0, results: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return { total, page, limit, items };
});

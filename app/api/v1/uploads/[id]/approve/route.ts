import { Types } from "mongoose";
import { z } from "zod";
import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { decryptJson } from "@/lib/crypto";
import { loadInstitution, processRows } from "@/lib/intake";
import { recomputeRisk } from "@/lib/checks";
import type { StudentRow } from "@/lib/validation/schema";
import type { ServerRowIssue } from "@/lib/validation/server";
import { UploadBatch } from "@/models";

export const dynamic = "force-dynamic";

export const maxDuration = 60; // seconds (Vercel function limit for heavy jobs)

const Body = z.object({ action: z.enum(["approve", "reject"]).default("approve") });

/** POST /api/v1/uploads/:id/approve — institution admin commits valid rows to the central repository */
export const POST = route(
  { roles: ["INSTITUTION"], perms: { INSTITUTION: ["admin"] }, body: Body, idempotent: true },
  async ({ actor, params, body, ip }) => {
    if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
    const b = await UploadBatch.findOneAndUpdate(
      { _id: params.id, institutionId: actor.institutionId, status: "submitted" },
      { $set: { status: body.action === "approve" ? "approved" : "rejected", approvedBy: actor.email, approvedAt: new Date() } },
      { new: true }
    );
    if (!b) throw new ApiError(409, "Batch not found or not awaiting approval");
    if (body.action === "reject") {
      await audit({ actor: actor.email, role: actor.role, action: "upload.reject", entity: "UploadBatch", entityId: String(b._id), ip });
      return { ok: true, status: "rejected" };
    }
    const rows = decryptJson<StudentRow[]>(b.rowsEnc) ?? [];
    const inst = await loadInstitution(actor.institutionId!);
    // re-use the stored validation for row errors; the seat ledger decides intake at commit time
    const prior = ((b.results ?? []) as { issues: ServerRowIssue[] }[]).map((r) => r.issues.filter((i) => i.type !== "intake_exceeded"));
    const outcomes = await processRows(rows, inst, actor, { batchId: b._id, ip, preValidated: prior });
    const summary = {
      committed: outcomes.filter((o) => o.status === "committed").length,
      rejectedBySeatLedger: outcomes.filter((o) => o.status === "rejected").length,
      skippedWithErrors: outcomes.filter((o) => o.status === "error").length,
    };
    b.commitSummary = { ...summary, rejected: outcomes.filter((o) => o.status === "rejected").map((o) => ({ rowNumber: o.rowNumber, message: o.message })) };
    b.rowsEnc = undefined; // committed data now lives in the repository; drop the staging copy
    await b.save();
    await audit({ actor: actor.email, role: actor.role, action: "upload.approve", entity: "UploadBatch", entityId: String(b._id), after: summary, ip });
    await recomputeRisk();
    return { ok: true, status: "approved", ...summary, outcomes: outcomes.filter((o) => o.status !== "committed").map((o) => ({ rowNumber: o.rowNumber, status: o.status, message: o.message })) };
  }
);

import { Types } from "mongoose";
import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getRules } from "@/lib/rules";
import { UploadBatch, User } from "@/models";
import { getWhatsApp } from "@/lib/whatsapp/adapter";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/** POST /api/v1/uploads/:id/submit — operator submits a validated draft for institution-admin approval */
export const POST = route({ roles: ["INSTITUTION"] }, async ({ actor, params, ip }) => {
  if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
  const b = await UploadBatch.findOne({ _id: params.id, institutionId: actor.institutionId });
  if (!b) throw new ApiError(404, "Batch not found");
  if (b.status !== "draft") throw new ApiError(409, `Batch is already ${b.status}`);
  const rules = await getRules();
  const now = new Date();
  const deadline = new Date(rules.deadlineDate);
  b.status = "submitted";
  b.submittedAt = now;
  b.lateUpload = (b.rowCount ?? 0) >= 50 && now <= deadline && deadline.getTime() - now.getTime() <= 3600_000;
  await b.save();

  // row issues become ValidationIssues at approval, linked to the committed student records

  // notify institution admins
  const admins = await User.find({ institutionId: actor.institutionId, role: "INSTITUTION", permission: "admin" }, { phone: 1 }).lean();
  for (const a of admins) {
    const p = decrypt(a.phone);
    if (p) await getWhatsApp().send(p, `📤 Upload "${b.fileName}" (${b.rowCount} rows, ${b.errorRows} with errors) submitted by ${actor.name} is awaiting your approval.`);
  }
  await audit({ actor: actor.email, role: actor.role, action: "upload.submit", entity: "UploadBatch", entityId: String(b._id), ip });
  return { ok: true, status: b.status, lateUpload: b.lateUpload };
});

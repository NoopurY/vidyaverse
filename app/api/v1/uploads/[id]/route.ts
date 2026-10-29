import { Types } from "mongoose";
import { route, ApiError } from "@/lib/api";
import { UploadBatch } from "@/models";

export const dynamic = "force-dynamic";

export const GET = route({ roles: ["INSTITUTION"] }, async ({ actor, params }) => {
  if (!Types.ObjectId.isValid(params.id)) throw new ApiError(400, "Invalid id");
  const b = await UploadBatch.findOne({ _id: params.id, institutionId: actor.institutionId }, { rowsEnc: 0 }).lean();
  if (!b) throw new ApiError(404, "Batch not found");
  return b;
});

import { Types } from "mongoose";
import { route, ApiError, assertInstitutionAccess } from "@/lib/api";
import { ledgerSummary } from "@/lib/ledger";
import { CURRENT_YEAR } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET /api/v1/programs/:id/ledger?institutionId=&year= — approved / consumed / remaining per seat type */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, params, query }) => {
  const institutionId = actor.role === "INSTITUTION" ? actor.institutionId! : query.get("institutionId");
  if (!institutionId || !Types.ObjectId.isValid(institutionId)) throw new ApiError(400, "institutionId is required");
  await assertInstitutionAccess(actor, institutionId);
  const rows = await ledgerSummary({ institutionId: new Types.ObjectId(institutionId), programId: params.id, academicYear: query.get("year") ?? CURRENT_YEAR });
  return { programId: params.id, rows };
});

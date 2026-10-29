import { route } from "@/lib/api";
import { scopedInstitutions } from "@/lib/analytics";
import { ledgerSummary } from "@/lib/ledger";
import { CURRENT_YEAR, SEAT_TYPE_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET /api/v1/ledger — seat ledger across the actor's scope, grouped by institution and program */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION"] }, async ({ actor, query }) => {
  const insts = await scopedInstitutions(actor, { state: query.get("state") ?? undefined, region: query.get("region") ?? undefined, institutionId: query.get("institutionId") ?? undefined });
  const year = query.get("year") ?? CURRENT_YEAR;
  const rows = await ledgerSummary({ institutionId: { $in: insts.map((i) => i._id) }, academicYear: year });
  const byInst = insts.map((i) => {
    const r = rows.filter((x) => x.institutionId === String(i._id));
    return {
      institutionId: String(i._id),
      name: i.name,
      state: i.state,
      approved: r.reduce((a, x) => a + x.approved, 0),
      consumed: r.reduce((a, x) => a + x.consumed, 0),
      programs: i.programs.map((p) => ({
        programId: p.programId,
        name: p.name,
        discipline: p.discipline,
        seats: r
          .filter((x) => x.programId === p.programId)
          .map((x) => ({ seatType: x.seatType, label: SEAT_TYPE_LABEL[x.seatType], approved: x.approved, consumed: x.consumed, remaining: x.remaining })),
      })),
    };
  });
  byInst.sort((a, b) => b.consumed / (b.approved || 1) - a.consumed / (a.approved || 1));
  return { year, institutions: byInst };
});

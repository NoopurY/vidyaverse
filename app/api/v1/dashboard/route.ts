import { route } from "@/lib/api";
import { byState, filtersFrom, institutionMetrics, scopedInstitutions, totals } from "@/lib/analytics";
import { CURRENT_YEAR } from "@/lib/constants";

/** GET /api/v1/dashboard?state=&year= — national → state → institution drill-down (aggregated, no PII) */
export const GET = route({ roles: ["AICTE_ADMIN"] }, async ({ actor, query }) => {
  const f = filtersFrom(query);
  const year = f.year ?? CURRENT_YEAR;
  const all = await institutionMetrics(await scopedInstitutions(actor, { region: f.region, institutionType: f.institutionType, discipline: f.discipline }), { ...f, year });
  const scoped = f.state ? all.filter((r) => r.state === f.state) : all;
  const t = totals(scoped);
  const highRisk = [...scoped]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map((r) => ({ id: r.id, name: r.name, state: r.state, riskScore: r.riskScore, badge: r.badge, complianceScore: r.complianceScore, reasons: r.riskReasons.slice(0, 3) }));
  return {
    year,
    scope: actor.permission === "regional" ? `Region: ${actor.region}` : "National",
    state: f.state ?? null,
    kpis: {
      institutions: t.institutions,
      approvedIntake: t.approvedIntake,
      enrolled: t.enrolled,
      fillPct: t.fillPct,
      activeFlags: t.activeFlags,
      seatsRemaining: t.seatsRemaining,
    },
    states: byState(all),
    institutions: f.state
      ? scoped.map((r) => ({ id: r.id, name: r.name, district: r.district, intake: r.intake, enrolled: r.enrolled, fillPct: r.fillPct, flags: r.openFlags, riskScore: r.riskScore, badge: r.badge }))
      : [],
    highRisk,
    trend: t.trend,
    categorySplit: t.categorySplit,
    outcomes: t.outcomes,
    outcomesByState: byState(scoped).map((s) => ({ state: s.state, placement: Number(s.placementRate.toFixed(1)), higher: Number(s.higherRate.toFixed(1)) })),
  };
});

/** Aggregation pipelines for dashboards and reports (token-based; no PII leaves this layer). */
import { Types } from "mongoose";
import { Institution, SeatToken, Student, ValidationIssue, type InstitutionDoc } from "@/models";
import { CURRENT_YEAR, STATES, ACADEMIC_YEARS } from "./constants";
import { type Actor, institutionScope } from "./api";

export type Filters = { year?: string; state?: string; region?: string; discipline?: string; institutionType?: string; institutionId?: string };

export function filtersFrom(q: URLSearchParams): Filters {
  const f: Filters = {};
  for (const k of ["year", "state", "region", "discipline", "institutionType", "institutionId"] as const) {
    const v = q.get(k);
    if (v) f[k] = v;
  }
  return f;
}

export async function scopedInstitutions(actor: Actor, f: Filters = {}) {
  const match: Record<string, unknown> = { ...institutionScope(actor) };
  if (f.state) match.state = f.state;
  if (f.region && !match.region) match.region = f.region;
  if (f.institutionType) match.type = f.institutionType;
  if (f.institutionId && Types.ObjectId.isValid(f.institutionId)) {
    if (actor.role !== "INSTITUTION") match._id = new Types.ObjectId(f.institutionId);
  }
  if (f.discipline) match["programs.discipline"] = f.discipline;
  return Institution.find(match, { apiClientSecretHash: 0, apiKeyHash: 0, webhookSecret: 0 }).lean<InstitutionDoc[]>();
}

const programIdsFor = (insts: InstitutionDoc[], discipline?: string) =>
  discipline ? insts.flatMap((i) => i.programs.filter((p) => p.discipline === discipline).map((p) => p.programId)) : null;

/** Per-institution numbers: intake, enrolled (by year), seats, categories, outcomes, open flags */
export async function institutionMetrics(insts: InstitutionDoc[], f: Filters = {}) {
  const year = f.year ?? CURRENT_YEAR;
  const ids = insts.map((i) => i._id);
  const pids = programIdsFor(insts, f.discipline);
  const sMatch: Record<string, unknown> = { institutionId: { $in: ids } };
  if (pids) sMatch.programId = { $in: pids };

  const [byYear, cats, seats, outcomes, issues] = await Promise.all([
    Student.aggregate([
      { $match: { ...sMatch, status: { $in: ["active", "graduated"] } } },
      { $group: { _id: { i: "$institutionId", y: "$academicYear" }, n: { $sum: 1 } } },
    ]),
    Student.aggregate([
      { $match: { ...sMatch, academicYear: year, status: { $in: ["active", "graduated"] } } },
      { $group: { _id: { i: "$institutionId", c: "$category", n: "$nationalityStatus", s: "$seatType", g: "$gender" }, n: { $sum: 1 } } },
    ]),
    SeatToken.aggregate([
      { $match: { institutionId: { $in: ids }, academicYear: year, ...(pids ? { programId: { $in: pids } } : {}) } },
      { $group: { _id: { i: "$institutionId", st: "$status", t: "$seatType" }, n: { $sum: 1 } } },
    ]),
    Student.aggregate([
      { $match: { ...sMatch, status: "graduated" } },
      { $group: { _id: { i: "$institutionId", o: "$outcome.type", c: "$outcome.consentGiven" }, n: { $sum: 1 } } },
    ]),
    ValidationIssue.aggregate([
      { $match: { institutionId: { $in: ids }, status: "open" } },
      { $group: { _id: { i: "$institutionId", t: "$type" }, n: { $sum: 1 } } },
    ]),
  ]);

  return insts.map((inst) => {
    const id = String(inst._id);
    const programs = f.discipline ? inst.programs.filter((p) => p.discipline === f.discipline) : inst.programs;
    const intake = programs.reduce((a, p) => a + p.approvedIntake, 0);
    const enrolledBy = Object.fromEntries(ACADEMIC_YEARS.map((y) => [y, byYear.filter((x) => String(x._id.i) === id && x._id.y === y).reduce((a, x) => a + x.n, 0)]));
    const c = cats.filter((x) => String(x._id.i) === id);
    const sum = (pred: (k: { c: string; n: string; s: string; g: string }) => boolean) => c.filter((x) => pred(x._id)).reduce((a, x) => a + x.n, 0);
    const s = seats.filter((x) => String(x._id.i) === id);
    const seatSum = (pred: (k: { st: string; t: string }) => boolean) => s.filter((x) => pred(x._id)).reduce((a, x) => a + x.n, 0);
    const o = outcomes.filter((x) => String(x._id.i) === id);
    const graduates = o.reduce((a, x) => a + x.n, 0);
    // aggregate rates use all declared outcomes; individual disclosure still requires the student's consent
    const placed = o.filter((x) => x._id.o === "placement").reduce((a, x) => a + x.n, 0);
    const higher = o.filter((x) => x._id.o === "higher-studies").reduce((a, x) => a + x.n, 0);
    const iss = issues.filter((x) => String(x._id.i) === id);
    const enrolled = enrolledBy[year] ?? 0;
    const regularConsumed = seatSum((k) => k.t === "regular" && k.st === "consumed");
    return {
      id,
      aicteId: inst.aicteId,
      name: inst.name,
      state: inst.state,
      district: inst.district,
      region: inst.region,
      type: inst.type,
      isDegreeAwarding: inst.isDegreeAwarding,
      programs: programs.length,
      intake,
      enrolled,
      enrolledBy,
      fillPct: intake ? (regularConsumed / intake) * 100 : 0,
      seatsApproved: seatSum(() => true),
      seatsConsumed: seatSum((k) => k.st === "consumed"),
      seatsRemaining: seatSum((k) => k.st !== "consumed"),
      categories: {
        General: sum((k) => k.c === "General"),
        SC: sum((k) => k.c === "SC"),
        ST: sum((k) => k.c === "ST"),
        OBC: sum((k) => k.c === "OBC"),
        EWS: sum((k) => k.c === "EWS"),
        NRI: sum((k) => k.n === "NRI"),
        OCI: sum((k) => k.n === "OCI"),
        FN: sum((k) => k.n === "FN"),
        supernumerary: sum((k) => k.s !== "regular"),
        female: sum((k) => k.g === "F"),
      },
      graduates,
      placed,
      higher,
      placementRate: graduates ? (placed / graduates) * 100 : 0,
      higherRate: graduates ? (higher / graduates) * 100 : 0,
      openFlags: iss.reduce((a, x) => a + x.n, 0),
      flagsByType: Object.fromEntries(iss.map((x) => [x._id.t, x.n])),
      riskScore: inst.riskScore ?? 0,
      riskReasons: inst.riskReasons ?? [],
      complianceScore: inst.complianceScore ?? 100,
      badge: inst.badge ?? "green",
      accreditation: inst.accreditation,
    };
  });
}

export type InstMetric = Awaited<ReturnType<typeof institutionMetrics>>[number];

export function byState(rows: InstMetric[]) {
  return STATES.map((s) => {
    const r = rows.filter((x) => x.state === s.name);
    const intake = r.reduce((a, x) => a + x.intake, 0);
    const consumedRegular = r.reduce((a, x) => a + (x.fillPct * x.intake) / 100, 0);
    const graduates = r.reduce((a, x) => a + x.graduates, 0);
    return {
      state: s.name,
      code: s.code,
      region: s.region,
      institutions: r.length,
      intake,
      enrolled: r.reduce((a, x) => a + x.enrolled, 0),
      enrolledBy: Object.fromEntries(ACADEMIC_YEARS.map((y) => [y, r.reduce((a, x) => a + (x.enrolledBy[y] ?? 0), 0)])),
      fillPct: intake ? (consumedRegular / intake) * 100 : 0,
      flags: r.reduce((a, x) => a + x.openFlags, 0),
      placementRate: graduates ? (r.reduce((a, x) => a + x.placed, 0) / graduates) * 100 : 0,
      higherRate: graduates ? (r.reduce((a, x) => a + x.higher, 0) / graduates) * 100 : 0,
    };
  }).filter((s) => s.institutions > 0);
}

export function totals(rows: InstMetric[]) {
  const intake = rows.reduce((a, x) => a + x.intake, 0);
  const consumedRegular = rows.reduce((a, x) => a + (x.fillPct * x.intake) / 100, 0);
  const graduates = rows.reduce((a, x) => a + x.graduates, 0);
  const cat = (k: keyof InstMetric["categories"]) => rows.reduce((a, x) => a + x.categories[k], 0);
  return {
    institutions: rows.length,
    approvedIntake: intake,
    enrolled: rows.reduce((a, x) => a + x.enrolled, 0),
    fillPct: intake ? (consumedRegular / intake) * 100 : 0,
    activeFlags: rows.reduce((a, x) => a + x.openFlags, 0),
    seatsRemaining: rows.reduce((a, x) => a + x.seatsRemaining, 0),
    trend: ACADEMIC_YEARS.map((y) => ({ year: y, enrolled: rows.reduce((a, x) => a + (x.enrolledBy[y] ?? 0), 0) })),
    categorySplit: (["General", "OBC", "SC", "ST", "EWS", "NRI", "OCI", "FN"] as const).map((k) => ({ name: k, value: cat(k) })),
    outcomes: {
      graduates,
      placementRate: graduates ? (rows.reduce((a, x) => a + x.placed, 0) / graduates) * 100 : 0,
      higherRate: graduates ? (rows.reduce((a, x) => a + x.higher, 0) / graduates) * 100 : 0,
    },
  };
}

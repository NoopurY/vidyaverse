/** Fraud intelligence checks (run by Vercel Cron and the "Run checks now" button). */
import { Types } from "mongoose";
import { dbConnect } from "./db";
import { refId } from "./crypto";
import { raiseAlert } from "./alerts";
import { getRules, type RulesT } from "./rules";
import { hintFor } from "./validation/hints";
import { CURRENT_YEAR } from "./constants";
import {
  CounsellingAllotment,
  Institution,
  ScholarshipRecord,
  Student,
  UploadBatch,
  ValidationIssue,
} from "@/models";

type IssueSeed = {
  type: string;
  severity: "high" | "medium" | "low";
  institutionId?: Types.ObjectId;
  region?: string;
  studentApaar?: string;
  studentId?: Types.ObjectId;
  details: string;
  meta?: Record<string, unknown>;
  dedupeKey: string;
};

/** Upserts open issues by dedupeKey; returns how many were newly created */
async function upsertIssues(seeds: IssueSeed[]) {
  if (!seeds.length) return 0;
  const res = await ValidationIssue.bulkWrite(
    seeds.map((s) => ({
      updateOne: {
        filter: { dedupeKey: s.dedupeKey, status: { $in: ["open", "overridden", "resolved"] } },
        update: { $setOnInsert: { ...s, fixHint: hintFor(s.type), status: "open" } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  return res.upsertedCount;
}

async function instIndex() {
  const insts = await Institution.find({}, { aicteId: 1, region: 1, name: 1, programs: 1 }).lean();
  return { byId: new Map(insts.map((i) => [String(i._id), i])), byAicte: new Map(insts.map((i) => [i.aicteId, i])) };
}

export async function scholarshipCheck() {
  await dbConnect();
  const { byAicte } = await instIndex();
  const records = await ScholarshipRecord.find().lean();
  // graduated students legitimately received scholarships while studying
  const active = await Student.find({ apaarId: { $in: records.map((r) => r.apaarId) }, status: { $in: ["active", "graduated"] } }, { apaarId: 1, institutionId: 1 }).lean();
  const activeAt = new Set(active.map((s) => `${s.apaarId}|${String(s.institutionId)}`));
  const seeds: IssueSeed[] = [];
  for (const r of records) {
    const inst = byAicte.get(r.institutionAicteId!);
    if (!inst) continue;
    if (activeAt.has(`${r.apaarId}|${String(inst._id)}`)) continue;
    seeds.push({
      type: "ghost_scholarship",
      severity: "high",
      institutionId: inst._id,
      region: inst.region,
      studentApaar: r.apaarId ?? undefined,
      details: `Possible ghost student: ${r.scheme} scholarship of ₹${(r.amount ?? 0).toLocaleString("en-IN")} paid for APAAR ${r.apaarId} (${r.name}), who is not an active student here`,
      meta: { scheme: r.scheme, amount: r.amount, year: r.year },
      dedupeKey: `ghost_scholarship:${String(r._id)}`,
    });
  }
  const created = await upsertIssues(seeds);
  if (created) {
    const byInst = new Map<string, number>();
    seeds.forEach((s) => byInst.set(String(s.institutionId), (byInst.get(String(s.institutionId)) ?? 0) + 1));
    for (const [id, n] of byInst)
      await raiseAlert({ type: "ghost_scholarship", severity: "high", institutionId: id, message: `${n} scholarship payment(s) to APAARs not active at this institution (possible ghost students)` });
  }
  return { flagged: seeds.length, created };
}

export async function counsellingCheckAll() {
  await dbConnect();
  const { byId } = await instIndex();
  const allot = await CounsellingAllotment.find({}, { apaarId: 1, institutionAicteId: 1, programName: 1 }).lean();
  const keys = new Set(allot.map((a) => `${a.apaarId}|${a.institutionAicteId}|${a.programName}`));
  const seeds: IssueSeed[] = [];
  const cursor = Student.find({ status: "active", academicYear: CURRENT_YEAR }, { apaarId: 1, institutionId: 1, programId: 1 }).lean().cursor();
  for await (const s of cursor) {
    const inst = byId.get(String(s.institutionId));
    if (!inst) continue;
    const program = inst.programs.find((p) => p.programId === s.programId);
    if (keys.has(`${s.apaarId}|${inst.aicteId}|${program?.name}`)) continue;
    seeds.push({
      type: "no_counselling",
      severity: "medium",
      institutionId: inst._id,
      region: inst.region,
      studentApaar: s.apaarId,
      studentId: s._id,
      details: "Admitted without counselling allotment",
      dedupeKey: `no_counselling:${String(s._id)}`,
    });
  }
  return { flagged: seeds.length, created: await upsertIssues(seeds) };
}

export async function crossDuplicateCheck() {
  await dbConnect();
  const { byId } = await instIndex();
  const groups = await Student.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$apaarToken", insts: { $addToSet: "$institutionId" }, students: { $push: { id: "$_id", inst: "$institutionId", apaar: "$apaarId" } } } },
    { $match: { "insts.1": { $exists: true } } },
  ]);
  const seeds: IssueSeed[] = [];
  for (const g of groups) {
    for (const s of g.students) {
      const inst = byId.get(String(s.inst));
      seeds.push({
        type: "cross_institution_duplicate",
        severity: "high",
        institutionId: s.inst,
        region: inst?.region,
        studentApaar: s.apaar,
        studentId: s.id,
        details: `Student is also actively enrolled at ${g.insts.length - 1} other institution(s) (${refId(g._id)})`,
        meta: { apaarToken: g._id, institutions: g.insts.map(String) },
        dedupeKey: `cross_dup:${String(s.id)}`,
      });
    }
  }
  const created = await upsertIssues(seeds);
  if (created) await raiseAlert({ type: "double_enrolment", severity: "high", message: `${groups.length} student(s) found actively enrolled in two or more institutions` });
  return { flagged: groups.length, created };
}

export async function sharedContactCheck(rules: RulesT) {
  await dbConnect();
  const { byId } = await instIndex();
  const seeds: IssueSeed[] = [];
  for (const field of ["phoneHash", "emailHash"] as const) {
    const groups = await Student.aggregate([
      { $match: { status: "active", [field]: { $ne: null } } },
      { $group: { _id: `$${field}`, n: { $sum: 1 }, insts: { $addToSet: "$institutionId" }, students: { $push: { id: "$_id", inst: "$institutionId", apaar: "$apaarId" } } } },
      { $match: { n: { $gte: rules.ghostSharedContactThreshold } } },
    ]);
    for (const g of groups)
      for (const s of g.students) {
        const inst = byId.get(String(s.inst));
        seeds.push({
          type: "shared_contact",
          severity: "high",
          institutionId: s.inst,
          region: inst?.region,
          studentApaar: s.apaar,
          studentId: s.id,
          details: `Same ${field === "phoneHash" ? "mobile number" : "email"} shared by ${g.n} students (ghost-student pattern)`,
          meta: { contactHash: g._id, field, count: g.n },
          dedupeKey: `shared:${field}:${String(s.id)}`,
        });
      }
  }
  return { flagged: seeds.length, created: await upsertIssues(seeds) };
}

export async function lateUploadCheck(rules: RulesT) {
  await dbConnect();
  const deadline = new Date(rules.deadlineDate);
  const from = new Date(deadline.getTime() - 3600_000);
  const batches = await UploadBatch.find({ submittedAt: { $gte: from, $lte: deadline }, rowCount: { $gte: 50 } }).lean();
  const { byId } = await instIndex();
  const seeds: IssueSeed[] = batches.map((b) => ({
    type: "late_bulk_upload",
    severity: "medium",
    institutionId: b.institutionId,
    region: byId.get(String(b.institutionId))?.region,
    details: `Bulk upload of ${b.rowCount} rows in the final hour before the deadline`,
    meta: { batchId: String(b._id) },
    dedupeKey: `late:${String(b._id)}`,
  }));
  await UploadBatch.updateMany({ _id: { $in: batches.map((b) => b._id) } }, { $set: { lateUpload: true } });
  return { flagged: seeds.length, created: await upsertIssues(seeds) };
}

/** Students with neither a counselling allotment nor any scholarship trail, aggregated per institution */
export async function ghostPatternCheck() {
  await dbConnect();
  const noCounselling = await ValidationIssue.aggregate([
    { $match: { type: "no_counselling", status: "open" } },
    { $group: { _id: "$institutionId", apaars: { $push: "$studentApaar" }, region: { $first: "$region" } } },
  ]);
  const seeds: IssueSeed[] = [];
  for (const g of noCounselling) {
    const withScholarship = await ScholarshipRecord.countDocuments({ apaarId: { $in: g.apaars } });
    const n = g.apaars.length - withScholarship;
    if (n >= 5)
      seeds.push({
        type: "ghost_pattern",
        severity: "medium",
        institutionId: g._id,
        region: g.region,
        details: `${n} students have neither a counselling allotment nor a scholarship trail`,
        meta: { count: n },
        dedupeKey: `ghost_pattern:${String(g._id)}:${n}`,
      });
  }
  return { flagged: seeds.length, created: await upsertIssues(seeds) };
}

const SEV_WEIGHT = { high: 5, medium: 2, low: 1 } as const;

/** Institution risk score 0–100 with human-readable reasons, compliance score and badge */
export async function recomputeRisk(rules?: RulesT) {
  await dbConnect();
  const r = rules ?? (await getRules());
  const w = r.riskWeights;
  const insts = await Institution.find().lean();
  const [prevYear] = ["2024-25"];

  const issueAgg = await ValidationIssue.aggregate([
    { $group: { _id: { i: "$institutionId", t: "$type", s: "$severity", st: "$status", stg: "$meta.staging" }, n: { $sum: 1 } } },
  ]);
  const enrolAgg = await Student.aggregate([
    { $match: { status: { $in: ["active", "graduated", "transferred", "dropped"] } } },
    { $group: { _id: { i: "$institutionId", y: "$academicYear", n: "$nationalityStatus" }, c: { $sum: 1 } } },
  ]);
  const breachAgg = await ValidationIssue.aggregate([
    { $match: { type: "intake_exceeded", "meta.breachAttempt": true } },
    { $group: { _id: "$institutionId", n: { $sum: 1 } } },
  ]);
  const lateAgg = await UploadBatch.aggregate([{ $match: { lateUpload: true } }, { $group: { _id: "$institutionId", n: { $sum: 1 } } }]);

  const ops = [];
  for (const inst of insts) {
    const id = String(inst._id);
    const openOf = (t: string) => issueAgg.filter((x) => String(x._id.i) === id && x._id.t === t && x._id.st === "open").reduce((a, x) => a + x.n, 0);
    // staging issues (upload rows that were never committed) are shown for fixing but do not affect compliance
    const open = issueAgg.filter((x) => String(x._id.i) === id && x._id.st === "open" && !x._id.stg);
    const openCount = open.reduce((a, x) => a + x.n, 0);
    const enrol = (y: string, nat?: string) =>
      enrolAgg.filter((x) => String(x._id.i) === id && x._id.y === y && (!nat || x._id.n === nat)).reduce((a, x) => a + x.c, 0);
    const cur = enrol(CURRENT_YEAR);
    const prev = enrol(prevYear);
    const foreign = enrol(CURRENT_YEAR, "NRI") + enrol(CURRENT_YEAR, "FN");
    const intake = inst.programs.reduce((a, p) => a + p.approvedIntake, 0);
    const regularFill = intake ? Math.min(cur, intake) / intake : 0;
    const breaches = breachAgg.find((x) => String(x._id) === id)?.n ?? 0;
    const late = lateAgg.find((x) => String(x._id) === id)?.n ?? 0;

    const factors: { pts: number; reason: string }[] = [];
    const add = (weight: number, frac: number, reason: string) => frac > 0 && factors.push({ pts: weight * Math.min(1, frac), reason });
    add(w.intakeBreach, breaches, `${breaches} admission attempt(s) beyond approved intake blocked`);
    add(w.crossDuplicate, openOf("cross_institution_duplicate") / 2, `${openOf("cross_institution_duplicate")} student(s) also enrolled at another institution`);
    add(w.counsellingMismatch, openOf("no_counselling") / 5, `${openOf("no_counselling")} admission(s) without counselling allotment`);
    add(w.scholarshipMismatch, openOf("ghost_scholarship") / 3, `${openOf("ghost_scholarship")} scholarship(s) paid to non-active APAARs`);
    add(w.sharedContact, openOf("shared_contact") / 3, `${openOf("shared_contact")} student(s) sharing a phone/email`);
    if (prev > 0 && ((cur - prev) / prev) * 100 > r.yoyJumpThreshold)
      add(w.yoyJump, 1, `Enrolment up ${Math.round(((cur - prev) / prev) * 100)}% vs last year`);
    if (regularFill >= 1 && cur > 0 && foreign / cur >= 0.12)
      add(w.fullFillHighForeign, 1, `100% fill with ${Math.round((foreign / cur) * 100)}% NRI/FN share`);
    add(w.lateUpload, late, `${late} bulk upload(s) in the final hour before the deadline`);
    add(w.openIssues, openCount / 20, `${openCount} open validation issue(s)`);
    factors.sort((a, b) => b.pts - a.pts);

    const riskScore = Math.min(100, Math.round(factors.reduce((a, f) => a + f.pts, 0)));
    const penalty = open.reduce((a, x) => a + x.n * SEV_WEIGHT[x._id.s as keyof typeof SEV_WEIGHT], 0);
    const complianceScore = Math.max(0, 100 - penalty);
    const badge = complianceScore >= 80 ? "green" : complianceScore >= 50 ? "amber" : "red";
    ops.push({
      updateOne: {
        filter: { _id: inst._id },
        update: { $set: { riskScore, riskReasons: factors.map((f) => f.reason), complianceScore, badge } },
      },
    });
  }
  if (ops.length) await Institution.bulkWrite(ops);
  return { institutions: ops.length };
}

export async function runAllChecks() {
  const rules = await getRules();
  const results = {
    scholarship: await scholarshipCheck(),
    counselling: await counsellingCheckAll(),
    crossDuplicates: await crossDuplicateCheck(),
    sharedContacts: await sharedContactCheck(rules),
    lateUploads: await lateUploadCheck(rules),
    ghostPattern: await ghostPatternCheck(),
  };
  const risk = await recomputeRisk(rules);
  return { ...results, risk };
}

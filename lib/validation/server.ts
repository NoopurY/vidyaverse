/** Server-side validation: registry match, duplicates (in-file, in-institution, cross-institution, fuzzy), intake. */
import { Types } from "mongoose";
import { apaarConnector } from "@/lib/apaar";
import { apaarToken, parentHash, refId } from "@/lib/crypto";
import { ledgerSummary } from "@/lib/ledger";
import type { RulesT } from "@/lib/rules";
import { Student } from "@/models";
import { hintFor } from "./hints";
import { nameSimilarity, phoneticNormalise } from "./fuzzy";
import { isBlocking, isValidApaar, RowIssue, validateRow } from "./rowRules";
import type { StudentRow } from "./schema";

type InstLike = { _id: Types.ObjectId; programs: { programId: string }[] };

const mk = (type: string, severity: RowIssue["severity"], field: string, message: string, meta?: Record<string, unknown>) =>
  ({ type, severity, field, message, fixHint: hintFor(type), ...(meta ? { meta } : {}) }) as RowIssue & { meta?: Record<string, unknown> };

export type ServerRowIssue = RowIssue & { meta?: Record<string, unknown> };

export async function validateRowsServer(
  rows: StudentRow[],
  inst: InstLike,
  rules: RulesT,
  opts: { excludeStudentId?: string; skipIntake?: boolean } = {}
): Promise<ServerRowIssue[][]> {
  const programIds = inst.programs.map((p) => p.programId);
  const result: ServerRowIssue[][] = rows.map((r) => validateRow(r, { programIds }));
  const exclude = opts.excludeStudentId ? new Types.ObjectId(opts.excludeStudentId) : undefined;

  // 1. APAAR registry (mock DigiLocker)
  const valid = rows.map((r) => r.apaarId).filter(isValidApaar);
  const registry = await apaarConnector.lookupMany(Array.from(new Set(valid)));
  rows.forEach((r, i) => {
    if (!isValidApaar(r.apaarId)) return;
    const rec = registry.get(r.apaarId);
    if (!rec) result[i].push(mk("apaar_not_found", "high", "apaarId", `APAAR ${r.apaarId} not found in the APAAR registry`));
    else {
      const sim = nameSimilarity(rec.name, r.name);
      if (sim < 0.85 || (r.dob && rec.dob !== r.dob))
        result[i].push(
          mk("apaar_mismatch", "high", sim < 0.85 ? "name" : "dob", `Registry has "${rec.name}", DOB ${rec.dob}; row has "${r.name}", DOB ${r.dob}`)
        );
    }
  });

  // 2. Duplicates inside the file
  const seen = new Map<string, number>();
  rows.forEach((r, i) => {
    if (!isValidApaar(r.apaarId)) return;
    if (seen.has(r.apaarId))
      result[i].push(mk("duplicate_in_institution", "high", "apaarId", `Same APAAR as row ${seen.get(r.apaarId)! + 2} in this file`));
    else seen.set(r.apaarId, i);
  });

  // 3. Already active at this institution / 4. active at another institution (via token only)
  const tokens = valid.map(apaarToken);
  const existing = await Student.find(
    { apaarToken: { $in: tokens }, status: "active", ...(exclude ? { _id: { $ne: exclude } } : {}) },
    { apaarToken: 1, institutionId: 1 }
  ).lean();
  rows.forEach((r, i) => {
    if (!isValidApaar(r.apaarId)) return;
    const tok = apaarToken(r.apaarId);
    for (const e of existing.filter((x) => x.apaarToken === tok)) {
      if (String(e.institutionId) === String(inst._id))
        result[i].push(mk("duplicate_in_institution", "high", "apaarId", "Student already exists at your institution (use Edit)"));
      else result[i].push(mk("cross_institution_duplicate", "high", "apaarId", `Already enrolled elsewhere (${refId(tok)})`));
    }
  });

  // 5. Fuzzy duplicates: similar phonetic name + exact DOB + same parent, different/missing APAAR
  const dobs = Array.from(new Set(rows.map((r) => r.dob).filter(Boolean)));
  const candidates = dobs.length
    ? await Student.find(
        { dob: { $in: dobs }, ...(exclude ? { _id: { $ne: exclude } } : {}) },
        { apaarId: 1, name: 1, dob: 1, parentHash: 1, institutionId: 1 }
      ).lean()
    : [];
  rows.forEach((r, i) => {
    if (!r.dob || !r.name) return;
    const ph = parentHash(r.parentName);
    const pool = [
      ...candidates.map((c) => ({ apaarId: c.apaarId, name: c.name, dob: c.dob, parentHash: c.parentHash, id: String(c._id), where: "repository" })),
      ...rows.slice(0, i).map((o, j) => ({ apaarId: o.apaarId, name: o.name, dob: o.dob, parentHash: parentHash(o.parentName), id: `row-${j + 2}`, where: "file" })),
    ];
    for (const c of pool) {
      if (c.dob !== r.dob || !ph || c.parentHash !== ph || (r.apaarId && c.apaarId === r.apaarId)) continue;
      const score = nameSimilarity(c.name, r.name);
      if (score >= rules.fuzzyThreshold) {
        result[i].push(
          mk("fuzzy_duplicate", "medium", "name", `Possible same person as "${c.name}" (${c.where}, similarity ${score.toFixed(2)})`, {
            candidateId: c.id,
            candidateApaar: c.apaarId,
            score,
          })
        );
        break;
      }
    }
  });

  // 6. Intake: rows that would exceed remaining seats per program / year / seat type
  if (!opts.skipIntake) {
    const ledger = await ledgerSummary({ institutionId: inst._id });
    const remaining = new Map(ledger.map((l) => [`${l.programId}|${l.academicYear}|${l.seatType}`, l.remaining]));
    rows.forEach((r, i) => {
      if (r.status !== "active" || isBlocking(result[i])) return;
      const key = `${r.programId}|${r.academicYear}|${r.seatType}`;
      const left = remaining.get(key) ?? 0;
      if (left <= 0)
        result[i].push(mk("intake_exceeded", "high", "seatType", `No ${r.seatType} seat left in ${r.programId} for ${r.academicYear} (approved intake reached)`));
      else remaining.set(key, left - 1);
    });
  }
  return result;
}

export { phoneticNormalise };

/** Student service: enrolment through the seat ledger, versioned updates, views with PII masking, time travel. */
import { Types } from "mongoose";
import { withTransaction } from "./db";
import { apaarToken, contactHash, decrypt, encrypt, parentHash, refId } from "./crypto";
import { audit } from "./audit";
import { consumeSeat, releaseSeat } from "./ledger";
import { raiseAlert } from "./alerts";
import { revokeCredentialsFor } from "./vc/statuslist";
import { hintFor } from "./validation/hints";
import { phoneticNormalise } from "./validation/fuzzy";
import { nationalityOf, type StudentRow } from "./validation/schema";
import { maskEmail, maskPhone } from "./utils";
import { CounsellingAllotment, Institution, Student, ValidationIssue, type InstitutionDoc, type StudentDoc } from "@/models";
import type { Actor } from "./api";

export const SNAPSHOT_FIELDS = [
  "name",
  "dob",
  "gender",
  "category",
  "nationalityStatus",
  "seatType",
  "programId",
  "academicYear",
  "admissionDate",
  "counsellingRef",
  "status",
  "institutionStudentId",
  "outcome",
] as const;

export function snapshotOf(s: Partial<StudentDoc>) {
  const snap: Record<string, unknown> = {};
  for (const f of SNAPSHOT_FIELDS) snap[f] = JSON.parse(JSON.stringify(s[f] ?? null));
  return snap;
}

export function docFromRow(row: StudentRow, institutionId: Types.ObjectId | string) {
  return {
    apaarId: row.apaarId,
    apaarToken: apaarToken(row.apaarId),
    institutionStudentId: row.institutionStudentId || undefined,
    name: row.name,
    nameNormalised: phoneticNormalise(row.name),
    dob: row.dob,
    gender: row.gender,
    parentName: encrypt(row.parentName),
    parentHash: parentHash(row.parentName),
    phone: encrypt(row.phone),
    phoneHash: contactHash(row.phone),
    email: encrypt(row.email),
    emailHash: contactHash(row.email),
    category: row.category,
    nationalityStatus: nationalityOf(row),
    seatType: row.seatType,
    institutionId: new Types.ObjectId(String(institutionId)),
    programId: row.programId,
    academicYear: row.academicYear,
    admissionDate: row.admissionDate,
    counsellingRef: row.counsellingRef || undefined,
    status: row.status || "active",
  };
}

export type EnrolResult =
  | { ok: true; student: StudentDoc }
  | { ok: false; code: "intake_exceeded" | "enrolled_elsewhere" | "duplicate"; message: string };

class SeatUnavailable extends Error {}

/** Enrols one student: blocks double enrolment, atomically consumes a seat token, creates the record. */
export async function enrolStudent(
  row: StudentRow,
  inst: Pick<InstitutionDoc, "_id" | "aicteId" | "region" | "name" | "programs">,
  actor: Pick<Actor, "email" | "role">,
  opts: { batchId?: Types.ObjectId; ip?: string } = {}
): Promise<EnrolResult> {
  const doc = docFromRow(row, inst._id);
  const active = await Student.findOne({ apaarToken: doc.apaarToken, status: "active" }, { institutionId: 1 }).lean();
  if (active) {
    if (String(active.institutionId) === String(inst._id))
      return { ok: false, code: "duplicate", message: "Student already exists at your institution" };
    return { ok: false, code: "enrolled_elsewhere", message: `Already enrolled elsewhere (${refId(doc.apaarToken)})` };
  }
  const prior = await Student.findOne({ apaarId: row.apaarId, institutionId: inst._id });

  try {
    const student = await withTransaction(async (session) => {
      if (doc.status === "active") {
        const seat = await consumeSeat(
          { institutionId: inst._id, programId: doc.programId, academicYear: doc.academicYear, seatType: doc.seatType, apaarToken: doc.apaarToken },
          session
        );
        if (!seat) throw new SeatUnavailable();
      }
      const snapshot = snapshotOf(doc as Partial<StudentDoc>);
      if (prior) {
        // re-admission of a previously dropped / transferred-out student at the same institution
        const version = (prior.version ?? 1) + 1;
        Object.assign(prior, doc, { batchId: opts.batchId, version });
        prior.history.push({ version, changedBy: actor.email, changedAt: new Date(), diff: { readmitted: true }, snapshot });
        await prior.save({ session });
        return prior;
      }
      const [created] = await Student.create(
        [{ ...doc, batchId: opts.batchId, version: 1, history: [{ version: 1, changedBy: actor.email, changedAt: new Date(), diff: { created: true }, snapshot }] }],
        { session }
      );
      return created;
    });

    await audit({ actor: actor.email, role: actor.role, action: "student.enrol", entity: "Student", entityId: String(student._id), after: { apaarToken: doc.apaarToken, programId: doc.programId, seatType: doc.seatType, academicYear: doc.academicYear }, ip: opts.ip });
    await counsellingCheck(student, inst);
    return { ok: true, student };
  } catch (e) {
    if (!(e instanceof SeatUnavailable)) throw e;
    const msg = `Admission blocked by Seat Ledger: no ${doc.seatType.toUpperCase()} seat left in ${doc.programId} (${doc.academicYear}). Attempted beyond approved intake.`;
    await Promise.all([
      raiseAlert({ type: "intake_breach", severity: "high", institutionId: inst._id, message: msg, whatsapp: true, webhookEvent: "intake.breach", data: { programId: doc.programId, seatType: doc.seatType, academicYear: doc.academicYear } }),
      ValidationIssue.create({
        type: "intake_exceeded",
        severity: "high",
        institutionId: inst._id,
        region: inst.region,
        batchId: opts.batchId,
        details: msg,
        fixHint: hintFor("intake_exceeded"),
        meta: { breachAttempt: true, programId: doc.programId, seatType: doc.seatType },
      }),
      audit({ actor: actor.email, role: actor.role, action: "ledger.breach_blocked", entity: "Institution", entityId: String(inst._id), after: { programId: doc.programId, seatType: doc.seatType, apaarToken: doc.apaarToken }, ip: opts.ip }),
    ]);
    return { ok: false, code: "intake_exceeded", message: msg };
  }
}

/** Every admitted student must match a counselling allotment (APAAR + institution + program) */
export async function counsellingCheck(s: Pick<StudentDoc, "_id" | "apaarId" | "programId" | "status">, inst: Pick<InstitutionDoc, "_id" | "aicteId" | "region" | "programs">) {
  if (s.status !== "active") return true;
  const program = inst.programs.find((p) => p.programId === s.programId);
  const match = await CounsellingAllotment.findOne({ apaarId: s.apaarId, institutionAicteId: inst.aicteId, programName: program?.name }).lean();
  if (match) return true;
  const dedupeKey = `no_counselling:${s._id}`;
  await ValidationIssue.updateOne(
    { dedupeKey, status: "open" },
    {
      $setOnInsert: {
        type: "no_counselling",
        severity: "medium",
        studentApaar: s.apaarId,
        studentId: s._id,
        institutionId: inst._id,
        region: inst.region,
        details: "Admitted without counselling allotment",
        fixHint: hintFor("no_counselling"),
        dedupeKey,
        status: "open",
      },
    },
    { upsert: true }
  );
  return false;
}

const EDITABLE = [
  "name",
  "dob",
  "gender",
  "category",
  "nationalityStatus",
  "seatType",
  "programId",
  "academicYear",
  "admissionDate",
  "counsellingRef",
  "status",
  "institutionStudentId",
] as const;

/** Versioned update: diff + snapshot into history, seat ledger moves, credential revocation, audit. */
export async function updateStudent(
  student: StudentDoc & { save: (o?: object) => Promise<unknown> },
  patch: Partial<Record<(typeof EDITABLE)[number] | "phone" | "email" | "parentName" | "outcome", unknown>>,
  actor: Pick<Actor, "email" | "role">,
  ip?: string
) {
  const before = snapshotOf(student);
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  const next: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (patch[k] !== undefined && patch[k] !== (student as Record<string, unknown>)[k]) {
      diff[k] = { from: (student as Record<string, unknown>)[k], to: patch[k] };
      next[k] = patch[k];
    }
  }
  if (patch.phone !== undefined && patch.phone !== decrypt(student.phone)) {
    diff.phone = { from: "••••", to: "••••" };
    next.phone = encrypt(String(patch.phone));
    next.phoneHash = contactHash(String(patch.phone));
  }
  if (patch.email !== undefined && patch.email !== decrypt(student.email)) {
    diff.email = { from: "••••", to: "••••" };
    next.email = encrypt(String(patch.email));
    next.emailHash = contactHash(String(patch.email));
  }
  if (patch.parentName !== undefined && patch.parentName !== decrypt(student.parentName)) {
    diff.parentName = { from: "••••", to: "••••" };
    next.parentName = encrypt(String(patch.parentName));
    next.parentHash = parentHash(String(patch.parentName));
  }
  if (patch.outcome !== undefined) {
    diff.outcome = { from: student.outcome, to: patch.outcome };
    next.outcome = patch.outcome;
  }
  if (next.name) next.nameNormalised = phoneticNormalise(String(next.name));
  if (!Object.keys(diff).length) return { changed: false, student };

  // active and graduated students hold their seat; dropped / transferred release it
  const holdsSeat = (st?: unknown) => st === "active" || st === "graduated";
  const wasActive = holdsSeat(student.status);
  const willBeActive = holdsSeat(next.status ?? student.status);
  const seatMoved = wasActive && willBeActive && (next.programId || next.seatType || next.academicYear);
  const inst = await Institution.findById(student.institutionId).lean();

  try {
    await withTransaction(async (session) => {
      if (wasActive && (!willBeActive || seatMoved)) {
        await releaseSeat({ institutionId: student.institutionId, programId: student.programId, academicYear: student.academicYear, apaarToken: student.apaarToken }, session);
      }
      if (willBeActive && (!wasActive || seatMoved)) {
        if (!wasActive) {
          const elsewhere = await Student.findOne({ apaarToken: student.apaarToken, status: "active", _id: { $ne: student._id } }, null, { session }).lean();
          if (elsewhere) throw new Error(`Already enrolled elsewhere (${refId(student.apaarToken)})`);
        }
        const seat = await consumeSeat(
          {
            institutionId: student.institutionId,
            programId: String(next.programId ?? student.programId),
            academicYear: String(next.academicYear ?? student.academicYear),
            seatType: String(next.seatType ?? student.seatType),
            apaarToken: student.apaarToken,
          },
          session
        );
        if (!seat) throw new SeatUnavailable();
      }
      Object.assign(student, next);
      student.version = (student.version ?? 1) + 1;
      student.history.push({ version: student.version, changedBy: actor.email, changedAt: new Date(), diff, snapshot: snapshotOf(student) });
      await student.save({ session });
    });
  } catch (e) {
    if (e instanceof SeatUnavailable && inst) {
      await raiseAlert({ type: "intake_breach", severity: "high", institutionId: inst._id, message: `Seat Ledger blocked a change for ${student.programId}: no seat available.`, whatsapp: true, webhookEvent: "intake.breach" });
      throw new Error("No seat available for this program / seat type (approved intake reached)");
    }
    throw e;
  }
  await revokeCredentialsFor(student.apaarId); // status/record change invalidates issued credentials
  await audit({ actor: actor.email, role: actor.role, action: "student.update", entity: "Student", entityId: String(student._id), before, after: snapshotOf(student), ip });
  if (inst && (diff.programId || diff.status)) await counsellingCheck(student, inst);
  return { changed: true, student };
}

/** Record as of a past date, rebuilt from the version history */
export function snapshotAsOf(s: Pick<StudentDoc, "history">, asOf: Date) {
  const versions = [...(s.history ?? [])].sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
  let found: (typeof versions)[number] | undefined;
  for (const v of versions) if (v.changedAt && new Date(v.changedAt) <= asOf) found = v;
  return found ? { version: found.version, changedAt: found.changedAt, changedBy: found.changedBy, snapshot: found.snapshot } : null;
}

/** Shape for API/UI. Contacts are decrypted then masked unless `reveal` is set (detail view, audited). */
export function studentView(s: StudentDoc, opts: { reveal?: boolean } = {}) {
  const phone = decrypt(s.phone);
  const email = decrypt(s.email);
  return {
    id: String(s._id),
    apaarId: s.apaarId,
    institutionStudentId: s.institutionStudentId,
    name: s.name,
    dob: s.dob,
    gender: s.gender,
    category: s.category,
    nationalityStatus: s.nationalityStatus,
    seatType: s.seatType,
    institutionId: String(s.institutionId),
    programId: s.programId,
    academicYear: s.academicYear,
    admissionDate: s.admissionDate,
    counsellingRef: s.counsellingRef,
    status: s.status,
    outcome: s.outcome,
    version: s.version,
    phone: opts.reveal ? phone : maskPhone(phone),
    email: opts.reveal ? email : maskEmail(email),
    parentName: opts.reveal ? decrypt(s.parentName) : undefined,
    updatedAt: s.updatedAt,
  };
}

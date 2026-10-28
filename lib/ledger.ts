/** Digital Seat Ledger: one SeatToken per approved seat; enrolment atomically consumes a token. */
import { ClientSession, Types } from "mongoose";
import { SeatToken, ProgramDoc, SUPERNUMERARY_TYPES } from "@/models";
import type { RulesT } from "./rules";

export type SeatQuota = Record<"regular" | "nri" | "oci" | "fn" | "tfw" | "other", number>;

/** Supernumerary seats are the approved count capped by the Rules quota (% of approved intake) */
export function seatQuota(program: Pick<ProgramDoc, "approvedIntake" | "supernumeraryApproved">, rules: RulesT): SeatQuota {
  const q = { regular: program.approvedIntake } as SeatQuota;
  for (const t of SUPERNUMERARY_TYPES) {
    const approved = (program.supernumeraryApproved as Record<string, number> | undefined)?.[t] ?? 0;
    q[t] = Math.min(approved, Math.floor((rules.quotaLimits[t] * program.approvedIntake) / 100));
  }
  return q;
}

/** Creates any missing tokens for a program/year (idempotent). Returns number of tokens created. */
export async function generateSeatTokens(
  institutionId: Types.ObjectId | string,
  program: Pick<ProgramDoc, "programId" | "approvedIntake" | "supernumeraryApproved">,
  academicYear: string,
  rules: RulesT
) {
  const quota = seatQuota(program, rules);
  const instId = new Types.ObjectId(String(institutionId));
  let created = 0;
  for (const [seatType, count] of Object.entries(quota)) {
    if (!count) continue;
    const existing = await SeatToken.countDocuments({ institutionId: instId, programId: program.programId, academicYear, seatType });
    if (existing >= count) continue;
    const docs = [];
    for (let n = existing + 1; n <= count; n++)
      docs.push({ institutionId: instId, programId: program.programId, academicYear, seatType, seatNo: n, status: "available" });
    await SeatToken.insertMany(docs, { ordered: false }).catch((e) => {
      if (e.code !== 11000) throw e;
    });
    created += docs.length;
  }
  return created;
}

/** Atomically consumes one available (or released) seat; returns null when none is left. */
export async function consumeSeat(
  p: { institutionId: string | Types.ObjectId; programId: string; academicYear: string; seatType: string; apaarToken: string },
  session?: ClientSession
) {
  return SeatToken.findOneAndUpdate(
    {
      institutionId: new Types.ObjectId(String(p.institutionId)),
      programId: p.programId,
      academicYear: p.academicYear,
      seatType: p.seatType,
      status: { $in: ["available", "released"] },
    },
    { $set: { status: "consumed", studentApaarToken: p.apaarToken, consumedAt: new Date() } },
    { new: true, sort: { seatNo: 1 }, session }
  );
}

export async function releaseSeat(
  p: { institutionId: string | Types.ObjectId; programId: string; academicYear: string; apaarToken: string },
  session?: ClientSession
) {
  return SeatToken.findOneAndUpdate(
    {
      institutionId: new Types.ObjectId(String(p.institutionId)),
      programId: p.programId,
      academicYear: p.academicYear,
      studentApaarToken: p.apaarToken,
      status: "consumed",
    },
    { $set: { status: "released" }, $unset: { studentApaarToken: 1, consumedAt: 1 } },
    { new: true, session }
  );
}

export type LedgerRow = {
  institutionId: string;
  programId: string;
  academicYear: string;
  seatType: string;
  approved: number;
  consumed: number;
  remaining: number;
};

/** Aggregated approved / consumed / remaining by institution, program, year, seat type */
export async function ledgerSummary(match: Record<string, unknown>): Promise<LedgerRow[]> {
  const rows = await SeatToken.aggregate([
    { $match: match },
    {
      $group: {
        _id: { i: "$institutionId", p: "$programId", y: "$academicYear", t: "$seatType" },
        approved: { $sum: 1 },
        consumed: { $sum: { $cond: [{ $eq: ["$status", "consumed"] }, 1, 0] } },
      },
    },
    { $sort: { "_id.p": 1, "_id.t": 1 } },
  ]);
  return rows.map((r) => ({
    institutionId: String(r._id.i),
    programId: r._id.p,
    academicYear: r._id.y,
    seatType: r._id.t,
    approved: r.approved,
    consumed: r.consumed,
    remaining: r.approved - r.consumed,
  }));
}

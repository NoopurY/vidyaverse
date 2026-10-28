import { dbConnect } from "./db";
import { sha256 } from "./crypto";
import { AuditLog } from "@/models";

export type AuditInput = {
  actor: string;
  role: string;
  action: string;
  entity?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
};

/** Deterministic JSON (sorted keys) so the hash is reproducible from stored data */
export function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

const plain = (v: unknown) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export function entryHash(e: {
  seq: number;
  actor?: string | null;
  role?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  timestamp: Date | string;
  prevHash?: string | null;
}) {
  return sha256(
    stableStringify({
      seq: e.seq,
      actor: e.actor ?? null,
      role: e.role ?? null,
      action: e.action,
      entity: e.entity ?? null,
      entityId: e.entityId ?? null,
      before: e.before ?? null,
      after: e.after ?? null,
      ip: e.ip ?? null,
      timestamp: new Date(e.timestamp).toISOString(),
      prevHash: e.prevHash ?? "GENESIS",
    })
  );
}

/** Appends an entry to the SHA-256 hash chain. Retries on concurrent writers (unique seq). */
export async function audit(input: AuditInput) {
  await dbConnect();
  for (let attempt = 0; attempt < 8; attempt++) {
    const last = await AuditLog.findOne({}, { seq: 1, hash: 1 }).sort({ seq: -1 }).lean();
    const seq = (last?.seq ?? 0) + 1;
    const entry = {
      seq,
      actor: input.actor,
      role: input.role,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: plain(input.before),
      after: plain(input.after),
      ip: input.ip,
      timestamp: new Date(),
      prevHash: last?.hash ?? "GENESIS",
    };
    const hash = entryHash(entry);
    try {
      await AuditLog.create({ ...entry, hash });
      return;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  throw new Error("Could not append audit entry");
}

export async function verifyChain(): Promise<{ intact: boolean; checked: number; brokenAt?: number; reason?: string }> {
  await dbConnect();
  let prev = "GENESIS";
  let expectedSeq = 1;
  let checked = 0;
  const cursor = AuditLog.find().sort({ seq: 1 }).lean().cursor();
  for await (const e of cursor) {
    if (e.seq !== expectedSeq) return { intact: false, checked, brokenAt: expectedSeq, reason: "Missing entry (gap in sequence)" };
    if ((e.prevHash ?? "GENESIS") !== prev) return { intact: false, checked, brokenAt: e.seq, reason: "prevHash does not match" };
    if (entryHash(e) !== e.hash) return { intact: false, checked, brokenAt: e.seq, reason: "Entry content was modified" };
    prev = e.hash;
    expectedSeq++;
    checked++;
  }
  return { intact: true, checked };
}

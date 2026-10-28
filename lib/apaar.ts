/**
 * APAAR / DigiLocker connector. The mock implementation reads the seeded ApaarRegistry collection;
 * swap in a real implementation of ApaarConnector (e.g. DigiLocker partner API) without touching callers.
 */
import { dbConnect } from "./db";
import { ApaarRegistry } from "@/models";

export type ApaarRecord = { apaarId: string; name: string; dob: string; gender?: string; status: string };

export interface ApaarConnector {
  lookup(apaarId: string): Promise<ApaarRecord | null>;
  lookupMany(apaarIds: string[]): Promise<Map<string, ApaarRecord>>;
}

class MockApaarConnector implements ApaarConnector {
  async lookup(apaarId: string) {
    await dbConnect();
    const r = await ApaarRegistry.findOne({ apaarId }).lean();
    return r ? { apaarId: r.apaarId!, name: r.name!, dob: r.dob!, gender: r.gender ?? undefined, status: r.status! } : null;
  }
  async lookupMany(apaarIds: string[]) {
    await dbConnect();
    const rows = await ApaarRegistry.find({ apaarId: { $in: apaarIds } }).lean();
    return new Map(rows.map((r) => [r.apaarId!, { apaarId: r.apaarId!, name: r.name!, dob: r.dob!, gender: r.gender ?? undefined, status: r.status! }]));
  }
}

export const apaarConnector: ApaarConnector = new MockApaarConnector();

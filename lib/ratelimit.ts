import { dbConnect } from "./db";
import { RateLimit } from "@/models";

/** Fixed-window rate limiter stored in MongoDB (TTL index cleans up). Returns true when allowed. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  await dbConnect();
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const expiresAt = new Date((bucket + 1) * windowSec * 1000);
  const doc = await RateLimit.findOneAndUpdate(
    { key: `${key}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true }
  ).lean();
  const ok = (doc?.count ?? 0) <= limit;
  return { ok, retryAfter: Math.ceil((expiresAt.getTime() - now) / 1000) };
}

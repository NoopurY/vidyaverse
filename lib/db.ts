import mongoose, { ClientSession } from "mongoose";
import { env } from "./env";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __mongoose?: Cache };
const cache: Cache = g.__mongoose ?? (g.__mongoose = { conn: null, promise: null });

export async function dbConnect() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
  }
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null; // do not cache a failed connection; retry on the next request
    throw e;
  }
  return cache.conn;
}

let txnSupported: boolean | null = null;

/**
 * Runs fn inside a MongoDB transaction (Atlas replica set). On a standalone dev server that cannot run
 * transactions, it falls back to running fn without a session; the ledger still uses atomic
 * findOneAndUpdate so a seat can never be consumed twice.
 */
export async function withTransaction<T>(fn: (session: ClientSession | undefined) => Promise<T>): Promise<T> {
  await dbConnect();
  if (txnSupported === false) return fn(undefined);
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    txnSupported = true;
    return result as T;
  } catch (e) {
    const msg = String((e as Error).message || e);
    if (/Transaction numbers are only allowed|replica set|IllegalOperation/i.test(msg)) {
      txnSupported = false;
      return fn(undefined);
    }
    throw e;
  } finally {
    await session.endSession();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodType, ZodTypeDef } from "zod";

type Schema<B> = ZodType<B, ZodTypeDef, any>;
import { jwtVerify, SignJWT } from "jose";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { dbConnect } from "./db";
import { env } from "./env";
import { rateLimit } from "./ratelimit";
import { safeEqual, sha256 } from "./crypto";
import { IdempotencyRecord, Institution } from "@/models";

export type Role = "AICTE_ADMIN" | "INSTITUTION" | "STUDENT";
export type Actor = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permission: string;
  region?: string;
  institutionId?: string;
  studentApaar?: string;
  isDegreeAwarding?: boolean;
  via: "session" | "erp";
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

const erpKey = () => new TextEncoder().encode(`erp:${env.authSecret}`);

export async function issueErpToken(institutionId: string, clientId: string) {
  return new SignJWT({ scope: "students:write students:read uploads ledger", cid: clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(institutionId)
    .setAudience("vidyaverse-erp")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(erpKey());
}

/** Resolves the caller: ERP machine client (Bearer token + X-API-Key) or a browser session */
export async function getActor(req: NextRequest): Promise<Actor | null> {
  const authz = req.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    let sub: string;
    try {
      const { payload } = await jwtVerify(authz.slice(7), erpKey(), { audience: "vidyaverse-erp" });
      sub = String(payload.sub);
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) throw new ApiError(401, "X-API-Key header is required with the access token");
    await dbConnect();
    const inst = await Institution.findById(sub, { name: 1, region: 1, apiKeyHash: 1, apiKeyPrefix: 1, isDegreeAwarding: 1 }).lean();
    const prefix = apiKey.split("_")[1];
    if (!inst || !inst.apiKeyHash || inst.apiKeyPrefix !== prefix || !safeEqual(sha256(apiKey), inst.apiKeyHash))
      throw new ApiError(401, "Invalid API key");
    return {
      id: `erp:${sub}`,
      name: `${inst.name} ERP`,
      email: `erp@${sub}`,
      role: "INSTITUTION",
      permission: "operator",
      region: inst.region,
      institutionId: sub,
      isDegreeAwarding: !!inst.isDegreeAwarding,
      via: "erp",
    };
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return { ...(session.user as Omit<Actor, "via">), via: "session" };
}

type Ctx<B> = {
  req: NextRequest;
  params: Record<string, string>;
  actor: Actor;
  body: B;
  ip: string;
  query: URLSearchParams;
};

type Opts<B> = {
  roles?: Role[];
  /** permissions allowed per role, e.g. { AICTE_ADMIN: ["full","regional"] } */
  perms?: Partial<Record<Role, string[]>>;
  body?: Schema<B>;
  rate?: { name: string; limit: number; windowSec: number };
  idempotent?: boolean;
};

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

function errorResponse(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message, details: e.details }, e.status);
  if (e instanceof ZodError) return json({ error: "Validation failed", details: e.flatten() }, 422);
  console.error(e);
  return json({ error: "Internal server error" }, 500);
}

async function parseBody<B>(req: NextRequest, schema?: Schema<B>): Promise<B> {
  if (!schema) return undefined as B;
  let raw: unknown = {};
  const text = await req.text();
  if (text) {
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ApiError(400, "Body must be valid JSON");
    }
  }
  return schema.parse(raw);
}

/** Authenticated route wrapper: RBAC, zod validation, rate limiting, idempotency, uniform errors. */
export function route<B = undefined>(opts: Opts<B>, fn: (ctx: Ctx<B>) => Promise<unknown>) {
  return async (req: NextRequest, { params }: { params: Record<string, string> }) => {
    try {
      await dbConnect();
      const ip = clientIp(req);
      if (opts.rate) {
        const r = await rateLimit(`${opts.rate.name}:${ip}`, opts.rate.limit, opts.rate.windowSec);
        if (!r.ok) return json({ error: "Too many requests" }, 429, { "Retry-After": String(r.retryAfter) });
      }
      const actor = await getActor(req);
      if (!actor) throw new ApiError(401, "Authentication required");
      if (opts.roles && !opts.roles.includes(actor.role)) throw new ApiError(403, "Your role cannot access this resource");
      const allowed = opts.perms?.[actor.role];
      if (allowed && !allowed.includes(actor.permission))
        throw new ApiError(403, `Your permission (${actor.permission}) cannot perform this action`);
      const body = await parseBody(req, opts.body);
      const ctx: Ctx<B> = { req, params: params ?? {}, actor, body, ip, query: req.nextUrl.searchParams };

      const idemKey = opts.idempotent ? req.headers.get("idempotency-key") : null;
      if (idemKey) {
        const key = `${actor.id}:${req.nextUrl.pathname}:${idemKey}`;
        const prior = await IdempotencyRecord.findOne({ key }).lean();
        if (prior) return json(prior.response, prior.status ?? 200, { "Idempotent-Replay": "true" });
        const out = await fn(ctx);
        if (out instanceof Response) return out;
        await IdempotencyRecord.create({ key, response: out, status: 200, expiresAt: new Date(Date.now() + 86400_000) }).catch(() => {});
        return json(out);
      }
      const out = await fn(ctx);
      return out instanceof Response ? out : json(out);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Public (no login) route wrapper with mandatory rate limiting */
export function publicRoute<B = undefined>(
  opts: { body?: Schema<B>; rate: { name: string; limit: number; windowSec: number } },
  fn: (ctx: Omit<Ctx<B>, "actor">) => Promise<unknown>
) {
  return async (req: NextRequest, { params }: { params: Record<string, string> }) => {
    try {
      await dbConnect();
      const ip = clientIp(req);
      const r = await rateLimit(`${opts.rate.name}:${ip}`, opts.rate.limit, opts.rate.windowSec);
      if (!r.ok) return json({ error: "Too many requests. Please wait and try again." }, 429, { "Retry-After": String(r.retryAfter) });
      const body = await parseBody(req, opts.body);
      const out = await fn({ req, params: params ?? {}, body, ip, query: req.nextUrl.searchParams });
      return out instanceof Response ? out : json(out);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

// ---------- scoping helpers ----------

export const isReadonly = (a: Actor) => a.role === "AICTE_ADMIN" && a.permission === "readonly";
export const canSeePII = (a: Actor) => !isReadonly(a);

/** Mongo filter for institutions visible to the actor */
export function institutionScope(a: Actor): Record<string, unknown> {
  if (a.role === "AICTE_ADMIN") return a.permission === "regional" && a.region ? { region: a.region } : {};
  if (a.role === "INSTITUTION" && a.institutionId) return { _id: new Types.ObjectId(a.institutionId) };
  return { _id: null };
}

/** Throws unless the actor may access data of the given institution */
export async function assertInstitutionAccess(a: Actor, institutionId: string) {
  if (!Types.ObjectId.isValid(institutionId)) throw new ApiError(400, "Invalid institution id");
  if (a.role === "INSTITUTION") {
    if (a.institutionId !== String(institutionId)) throw new ApiError(403, "Institutions can only access their own data");
    return;
  }
  if (a.role === "AICTE_ADMIN") {
    if (a.permission === "regional") {
      const inst = await Institution.findById(institutionId, { region: 1 }).lean();
      if (!inst || inst.region !== a.region) throw new ApiError(403, "Outside your region");
    }
    return;
  }
  throw new ApiError(403, "Not allowed");
}

export function requirePII(a: Actor) {
  if (!canSeePII(a)) throw new ApiError(403, "Read-only regulators can access aggregated data only");
}

export function paging(q: URLSearchParams, max = 100) {
  const page = Math.max(1, parseInt(q.get("page") || "1", 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(q.get("limit") || "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

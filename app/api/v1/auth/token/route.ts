import { NextRequest } from "next/server";
import { z } from "zod";
import { issueErpToken, json, clientIp } from "@/lib/api";
import { dbConnect } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { safeEqual, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { Institution } from "@/models";

const Body = z.object({
  grant_type: z.literal("client_credentials"),
  client_id: z.string().max(100),
  client_secret: z.string().max(200),
});

/** OAuth2 client-credentials grant for institution ERPs (accepts JSON or form-encoded) */
export async function POST(req: NextRequest) {
  await dbConnect();
  const rl = await rateLimit(`token:${clientIp(req)}`, 20, 60);
  if (!rl.ok) return json({ error: "rate_limited" }, 429);
  let raw: Record<string, unknown> = {};
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) raw = Object.fromEntries(new URLSearchParams(await req.text()));
  else raw = await req.json().catch(() => ({}));
  const basic = req.headers.get("authorization");
  if (basic?.startsWith("Basic ")) {
    const [id, secret] = Buffer.from(basic.slice(6), "base64").toString().split(":");
    raw = { grant_type: "client_credentials", ...raw, client_id: id, client_secret: secret };
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_request" }, 400);
  const inst = await Institution.findOne({ apiClientId: parsed.data.client_id }, { apiClientSecretHash: 1, name: 1 }).lean();
  if (!inst?.apiClientSecretHash || !safeEqual(sha256(parsed.data.client_secret), inst.apiClientSecretHash))
    return json({ error: "invalid_client" }, 401);
  const token = await issueErpToken(String(inst._id), parsed.data.client_id);
  await audit({ actor: `erp:${parsed.data.client_id}`, role: "INSTITUTION", action: "erp.token_issued", entity: "Institution", entityId: String(inst._id), ip: clientIp(req) });
  return json({ access_token: token, token_type: "Bearer", expires_in: 3600, scope: "students:write students:read uploads ledger" });
}

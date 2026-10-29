import { NextRequest } from "next/server";
import { env } from "./env";
import { dbConnect } from "./db";
import { audit } from "./audit";

/** Wraps a Vercel Cron job: requires `Authorization: Bearer $CRON_SECRET` (open only in local dev without a secret). */
export function cronJob(name: string, job: () => Promise<unknown>) {
  return async (req: NextRequest) => {
    const secret = env.cronSecret;
    const authz = req.headers.get("authorization");
    if (secret ? authz !== `Bearer ${secret}` : env.isProd) return new Response("Unauthorized", { status: 401 });
    await dbConnect();
    const result = await job();
    await audit({ actor: "system:cron", role: "SYSTEM", action: `cron.${name}`, entity: "System", after: result });
    return Response.json({ ok: true, job: name, result });
  };
}

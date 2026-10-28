import { NextRequest } from "next/server";
import { clientIp } from "@/lib/api";
import { dbConnect } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { handleIncoming } from "@/lib/whatsapp/bot";
import { verifyMetaSignature } from "@/lib/whatsapp/adapter";

export const dynamic = "force-dynamic";

/** Meta webhook verification handshake */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (q.get("hub.mode") === "subscribe" && env.whatsapp.verifyToken && q.get("hub.verify_token") === env.whatsapp.verifyToken)
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

/** Incoming WhatsApp messages (Cloud API format). Signature is checked when WHATSAPP_APP_SECRET is set. */
export async function POST(req: NextRequest) {
  await dbConnect();
  const rl = await rateLimit(`wa-webhook:${clientIp(req)}`, 300, 60);
  if (!rl.ok) return new Response("Too many requests", { status: 429 });
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Invalid signature", { status: 401 });
  let payload: { entry?: { changes?: { value?: { messages?: { from: string; type: string; text?: { body: string } }[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = payload.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []) ?? [];
  for (const m of messages) if (m.type === "text" && m.text?.body) await handleIncoming(m.from, m.text.body.slice(0, 500));
  return Response.json({ ok: true });
}

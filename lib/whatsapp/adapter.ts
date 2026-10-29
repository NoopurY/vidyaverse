/** WhatsApp adapter: Meta WhatsApp Cloud API when configured, otherwise MOCK (stored + shown in the simulator). */
import { createHmac } from "crypto";
import { dbConnect } from "@/lib/db";
import { env } from "@/lib/env";
import { Notification } from "@/models";

export interface WhatsAppAdapter {
  readonly mode: "live" | "mock";
  send(to: string, message: string): Promise<{ ok: boolean; id?: string }>;
}

class MockAdapter implements WhatsAppAdapter {
  readonly mode = "mock" as const;
  async send(to: string, message: string) {
    await dbConnect();
    const n = await Notification.create({ channel: "whatsapp", to, message, direction: "out", status: "mock-delivered" });
    return { ok: true, id: String(n._id) };
  }
}

class CloudApiAdapter implements WhatsAppAdapter {
  readonly mode = "live" as const;
  constructor(private token: string, private phoneId: string) {}
  async send(to: string, message: string) {
    await dbConnect();
    const res = await fetch(`https://graph.facebook.com/v20.0/${this.phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\D/g, ""), type: "text", text: { body: message } }),
    }).catch(() => null);
    const ok = !!res?.ok;
    const n = await Notification.create({ channel: "whatsapp", to, message, direction: "out", status: ok ? "sent" : "failed" });
    return { ok, id: String(n._id) };
  }
}

export function getWhatsApp(): WhatsAppAdapter {
  const { token, phoneId } = env.whatsapp;
  return token && phoneId ? new CloudApiAdapter(token, phoneId) : new MockAdapter();
}

/** Verifies Meta's X-Hub-Signature-256 header (only enforced in live mode with an app secret) */
export function verifyMetaSignature(rawBody: string, header: string | null) {
  const secret = env.whatsapp.appSecret;
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return header.slice(7) === expected;
}

/** Normalises Indian numbers to 91XXXXXXXXXX for comparison */
export const normPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

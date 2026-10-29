/** Alerts fan out at the same moment: AICTE dashboard (Alert doc), WhatsApp to the institution, HMAC-signed webhook. */
import { createHmac } from "crypto";
import { Types } from "mongoose";
import { Alert, Institution } from "@/models";
import { getWhatsApp } from "./whatsapp/adapter";

type RaiseInput = {
  type: string;
  severity: "high" | "medium" | "low";
  institutionId?: string | Types.ObjectId;
  message: string;
  whatsapp?: boolean;
  webhookEvent?: string;
  data?: Record<string, unknown>;
};

export async function sendWebhook(
  inst: { webhookUrl?: string | null; webhookSecret?: string | null },
  event: string,
  data: Record<string, unknown>
) {
  if (!inst.webhookUrl || !inst.webhookSecret) return false;
  const body = JSON.stringify({ event, data, sentAt: new Date().toISOString() });
  const sig = createHmac("sha256", inst.webhookSecret).update(body).digest("hex");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(inst.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-VidyaVerse-Signature": `sha256=${sig}`, "X-VidyaVerse-Event": event },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function raiseAlert(input: RaiseInput) {
  const inst = input.institutionId
    ? await Institution.findById(input.institutionId, { name: 1, region: 1, contactPhone: 1, webhookUrl: 1, webhookSecret: 1 }).lean()
    : null;
  const channels = ["dashboard"];
  const tasks: Promise<unknown>[] = [];
  if (input.whatsapp && inst?.contactPhone) {
    channels.push("whatsapp");
    tasks.push(getWhatsApp().send(inst.contactPhone, `⚠️ AICTE VidyaVerse alert\n${inst.name}\n${input.message}`));
  }
  if (inst && input.webhookEvent && inst.webhookUrl) {
    channels.push("webhook");
    tasks.push(sendWebhook(inst, input.webhookEvent, { message: input.message, type: input.type, ...input.data }));
  }
  const alertP = Alert.create({
    type: input.type,
    severity: input.severity,
    institutionId: inst?._id,
    region: inst?.region,
    message: inst ? `${inst.name}: ${input.message}` : input.message,
    channelsSent: channels,
  });
  const [alert] = await Promise.all([alertP, ...tasks]);
  return alert;
}

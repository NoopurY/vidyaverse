/** WhatsApp bot: VERIFY <APAAR> <CODE> (employers), YES/NO <code> and REVOKE <consentId> (students). */
import { dbConnect } from "@/lib/db";
import { contactHash } from "@/lib/crypto";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { FIELD_LABEL } from "@/lib/constants";
import { decideConsent, verifyWithConsent } from "@/lib/consent";
import { Consent, Notification, Student } from "@/models";
import { getWhatsApp } from "./adapter";

const HELP =
  "VidyaVerse (AICTE) bot commands:\n• VERIFY <APAAR> <CODE> – verify a student with their consent code\n• YES <code> / NO <code> – approve or reject a consent request\n• REVOKE <consent ID> – revoke a consent\nसहायता: VERIFY, YES, NO, REVOKE";

async function studentApaarsForPhone(from: string) {
  const local = from.replace(/\D/g, "").replace(/^91(\d{10})$/, "$1");
  const students = await Student.find({ phoneHash: contactHash(local) }, { apaarId: 1 }).lean();
  return Array.from(new Set(students.map((s) => s.apaarId)));
}

export async function handleIncoming(from: string, text: string): Promise<string[]> {
  await dbConnect();
  await Notification.create({ channel: "whatsapp", from, to: "AICTE-BOT", message: text, direction: "in", status: "received" });
  const rl = await rateLimit(`wa:${from}`, 20, 60);
  const replies: string[] = [];
  const reply = async (m: string) => {
    replies.push(m);
    await getWhatsApp().send(from, m);
  };
  if (!rl.ok) {
    await reply("Too many messages. Please try again in a minute.");
    return replies;
  }

  const parts = text.trim().split(/\s+/);
  const cmd = (parts[0] || "").toUpperCase();

  if (cmd === "VERIFY") {
    const [apaar, code] = [parts[1], parts[2]];
    if (!/^\d{12}$/.test(apaar ?? "") || !/^\d{6}$/.test(code ?? "")) {
      await reply("Format: VERIFY <12-digit APAAR> <6-digit consent code>");
      return replies;
    }
    const r = await verifyWithConsent(apaar, code, `whatsapp:${from}`, "whatsapp");
    if (!r.ok) {
      await reply(`❌ ${r.reason.startsWith("Not authorised") ? r.reason : "Not authorised / consent expired"}`);
      return replies;
    }
    const lines = Object.entries(r.result.disclosed).map(([k, v]) => `${FIELD_LABEL[k] ?? k}: ${v}`);
    const checks = r.result.checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label}`).join("\n");
    await reply(
      `${r.result.valid ? "✅ Verified by AICTE" : "⚠️ Verification checks failed"}\n${lines.join("\n")}\n\n${checks}\n\nConsent ${r.consent.consentId} (${r.consent.purpose}) valid till ${new Date(r.consent.expiresAt).toDateString()}\nDetails: ${env.appUrl}/verify?apaar=${apaar}`
    );
    return replies;
  }

  if (cmd === "YES" || cmd === "NO" || cmd === "REVOKE") {
    const ref = (parts[1] || "").toUpperCase();
    const apaars = await studentApaarsForPhone(from);
    if (!apaars.length) {
      await reply("This number is not registered to any student record.");
      return replies;
    }
    const consent =
      cmd === "REVOKE"
        ? await Consent.findOne({ consentId: ref, dataPrincipal: { $in: apaars } })
        : await Consent.findOne({ code: ref, dataPrincipal: { $in: apaars }, status: "pending" });
    if (!consent) {
      await reply(cmd === "REVOKE" ? "No consent found with that ID for your record." : "No pending consent request with that code for your record.");
      return replies;
    }
    try {
      const action = cmd === "YES" ? "approve" : cmd === "NO" ? "reject" : "revoke";
      await decideConsent(consent, action, `whatsapp:${from}`, "whatsapp");
      const msg =
        action === "approve"
          ? `✅ Consent ${consent.consentId} approved. ${consent.requesterName} can verify with code ${consent.code} until ${consent.expiresAt.toDateString()}. Revoke anytime: REVOKE ${consent.consentId}`
          : action === "reject"
            ? `Consent request from ${consent.requesterName} rejected.`
            : `🔒 Consent ${consent.consentId} revoked. Verification with this code will now fail.`;
      await reply(msg);
    } catch (e) {
      await reply(`Could not update consent: ${(e as Error).message}`);
    }
    return replies;
  }

  await reply(HELP);
  return replies;
}

/** DEPA-style consent artefacts (DPDP Act 2023 aligned): request, approve, reject, revoke, verify-with-code. */
import { randomUUID } from "crypto";
import { CompactSign } from "jose";
import { z } from "zod";
import { audit } from "./audit";
import { contactHash, decrypt, randomCode } from "./crypto";
import { DEFAULT_DISCLOSED, DISCLOSABLE_FIELDS, FIELD_LABEL } from "./constants";
import { presentAndVerify } from "./vc/issue";
import { keyId, privateKey } from "./vc/keys";
import { getWhatsApp } from "./whatsapp/adapter";
import { stableStringify } from "./audit";
import { Consent, Student, VerificationLog, type ConsentDoc } from "@/models";

export const ConsentRequestInput = z.object({
  apaarId: z.string().regex(/^\d{12}$/, "APAAR ID must be 12 digits"),
  requesterName: z.string().min(2).max(120),
  requesterContact: z.string().min(5).max(120),
  requesterType: z.enum(["employer", "institution", "regulator", "other"]),
  purpose: z.enum(["employment", "higher-studies", "regulatory", "other"]),
  purposeNote: z.string().max(300).optional(),
  fieldsAllowed: z.array(z.enum(DISCLOSABLE_FIELDS)).min(1).default(DEFAULT_DISCLOSED as never),
  frequency: z.enum(["one-time", "until-expiry"]).default("until-expiry"),
  validDays: z.number().int().min(1).max(90).default(7),
});

export const PURPOSE_LABEL: Record<string, string> = {
  employment: "Employment verification",
  "higher-studies": "Higher-studies admission",
  regulatory: "Regulatory check",
  other: "Other",
};

/** The bilingual notice shown before any sharing (DPDP Act, 2023 – notice + purpose limitation) */
export const CONSENT_NOTICE = {
  en: "By approving, you allow AICTE (data fiduciary) to share only the listed fields of your verified academic record with the named requester, for the stated purpose, until the expiry date. You can revoke this consent at any time from the portal or by WhatsApp (REVOKE <consent ID>); revocation takes effect immediately. Category, contact details and parent name are never shared.",
  hi: "स्वीकृति देकर आप AICTE (डेटा फ़िड्यूशियरी) को अनुमति देते हैं कि वह आपके सत्यापित शैक्षणिक रिकॉर्ड के केवल सूचीबद्ध फ़ील्ड, बताए गए उद्देश्य के लिए, समाप्ति तिथि तक, नामित अनुरोधकर्ता के साथ साझा करे। आप पोर्टल या WhatsApp (REVOKE <consent ID>) से कभी भी सहमति वापस ले सकते हैं; यह तुरंत लागू होगी। श्रेणी, संपर्क विवरण और अभिभावक का नाम कभी साझा नहीं किया जाता।",
};

async function signArtefact(c: Pick<ConsentDoc, "consentId" | "dataPrincipal" | "dataFiduciary" | "requesterName" | "requesterType" | "purpose" | "fieldsAllowed" | "frequency" | "expiresAt" | "status">) {
  const body = stableStringify({
    consentId: c.consentId,
    dataPrincipal: c.dataPrincipal,
    dataFiduciary: c.dataFiduciary,
    requesterName: c.requesterName,
    requesterType: c.requesterType,
    purpose: c.purpose,
    fieldsAllowed: c.fieldsAllowed,
    frequency: c.frequency,
    expiresAt: new Date(c.expiresAt).toISOString(),
    status: c.status,
  });
  return new CompactSign(new TextEncoder().encode(body)).setProtectedHeader({ alg: "EdDSA", kid: keyId(), typ: "consent+jws" }).sign(await privateKey());
}

async function studentPhone(apaarId: string) {
  const s = await Student.findOne({ apaarId }, { phone: 1 }).sort({ status: 1, updatedAt: -1 }).lean();
  return decrypt(s?.phone);
}

export async function requestConsent(input: z.infer<typeof ConsentRequestInput>, by: string, channel = "web", preApproved = false) {
  const student = await Student.findOne({ apaarId: input.apaarId }).lean();
  if (!student) return null; // caller returns a generic message (no record enumeration)
  const fields = input.fieldsAllowed.filter((f) => (DISCLOSABLE_FIELDS as readonly string[]).includes(f));
  const doc = new Consent({
    consentId: `CNS-${randomUUID().slice(0, 8).toUpperCase()}`,
    dataPrincipal: input.apaarId,
    dataFiduciary: "AICTE",
    requesterName: input.requesterName,
    requesterContact: input.requesterContact,
    requesterType: input.requesterType,
    purpose: input.purpose,
    purposeNote: input.purposeNote,
    fieldsAllowed: fields,
    frequency: input.frequency,
    code: randomCode(6),
    status: preApproved ? "approved" : "pending",
    expiresAt: new Date(Date.now() + input.validDays * 86400_000),
    history: [{ status: "pending", at: new Date(), by, channel }],
  });
  if (preApproved) doc.history.push({ status: "approved", at: new Date(), by, channel });
  doc.signature = await signArtefact(doc);
  await doc.save();
  await audit({ actor: by, role: preApproved ? "STUDENT" : "VERIFIER", action: preApproved ? "consent.create_share" : "consent.request", entity: "Consent", entityId: doc.consentId, after: { purpose: doc.purpose, fields, requester: doc.requesterName } });

  if (!preApproved) {
    const phone = await studentPhone(input.apaarId);
    if (phone)
      await getWhatsApp().send(
        phone,
        `📋 Consent request (AICTE VidyaVerse)\nRequester: ${doc.requesterName} (${doc.requesterType})\nPurpose: ${PURPOSE_LABEL[doc.purpose]}\nFields: ${fields.map((f) => FIELD_LABEL[f] ?? f).join(", ")}\nValid till: ${doc.expiresAt.toDateString()}\n\nReply YES ${doc.code} to approve or NO ${doc.code} to reject.\nसहमति हेतु YES ${doc.code} / अस्वीकार हेतु NO ${doc.code} भेजें।`
      );
  }
  return doc;
}

export async function decideConsent(c: ConsentDoc & { save: () => Promise<unknown> }, action: "approve" | "reject" | "revoke", by: string, channel = "web") {
  const allowed: Record<string, string[]> = { approve: ["pending"], reject: ["pending"], revoke: ["approved", "pending"] };
  if (!allowed[action].includes(c.status!)) throw new Error(`Consent is ${c.status}; cannot ${action}`);
  if (action === "approve" && c.expiresAt < new Date()) throw new Error("Consent request has expired");
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "revoked";
  const before = c.status;
  c.status = status;
  c.history.push({ status, at: new Date(), by, channel });
  c.signature = await signArtefact(c);
  await c.save();
  await audit({ actor: by, role: "STUDENT", action: `consent.${action}`, entity: "Consent", entityId: c.consentId, before: { status: before }, after: { status } });
  if (action === "approve" && c.requesterContact && /\d{10}/.test(c.requesterContact.replace(/\D/g, "")))
    await getWhatsApp().send(c.requesterContact, `✅ Consent approved by the student.\nVerify with: VERIFY ${c.dataPrincipal} ${c.code}\nValid till ${c.expiresAt.toDateString()}.`);
  return c;
}

export async function expireConsents() {
  const res = await Consent.updateMany(
    { status: { $in: ["pending", "approved"] }, expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" }, $push: { history: { status: "expired", at: new Date(), by: "system", channel: "cron" } } }
  );
  return { expired: res.modifiedCount };
}

/** Consent-gated verification shared by /verify, WhatsApp and the API. Enforces purpose, expiry and status on the server. */
export async function verifyWithConsent(apaarId: string, code: string, who: string, channel: "web" | "whatsapp" | "api") {
  const deny = async (reason: string, consentId?: string) => {
    await VerificationLog.create({ who, channel, studentApaar: apaarId, consentId, result: `denied: ${reason}` });
    return { ok: false as const, reason };
  };
  const c = await Consent.findOne({ dataPrincipal: apaarId, code });
  if (!c) return deny("Not authorised: no consent found for this APAAR and code");
  if (c.status === "approved" && c.expiresAt < new Date()) {
    c.status = "expired";
    c.history.push({ status: "expired", at: new Date(), by: "system", channel });
    await c.save();
  }
  if (c.status !== "approved") return deny(`Not authorised: consent ${c.status}`, c.consentId);
  if (c.frequency === "one-time" && (c.usedCount ?? 0) >= 1) return deny("Not authorised: one-time consent already used", c.consentId);

  const student =
    (await Student.findOne({ apaarId, status: { $in: ["active", "graduated"] } }).sort({ updatedAt: -1 })) ??
    (await Student.findOne({ apaarId }).sort({ updatedAt: -1 }));
  if (!student) return deny("Record not found", c.consentId);
  const { presentation, result, credentialId } = await presentAndVerify(student, c.fieldsAllowed ?? DEFAULT_DISCLOSED);
  c.usedCount = (c.usedCount ?? 0) + 1;
  await c.save();
  await VerificationLog.create({ who, channel, studentApaar: apaarId, consentId: c.consentId, result: result.valid ? "verified" : "failed-checks" });
  await audit({ actor: who, role: "VERIFIER", action: "verification.consented_read", entity: "Student", entityId: String(student._id), after: { consentId: c.consentId, fields: c.fieldsAllowed, channel } });
  return {
    ok: true as const,
    consent: { consentId: c.consentId, requesterName: c.requesterName, purpose: c.purpose, expiresAt: c.expiresAt, fieldsAllowed: c.fieldsAllowed },
    result,
    presentation,
    credentialId,
  };
}

export const phoneMatchesStudent = (phone: string, phoneHash?: string | null) => !!phoneHash && contactHash(phone.replace(/^91(\d{10})$/, "$1")) === phoneHash;

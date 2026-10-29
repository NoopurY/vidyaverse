import { z } from "zod";
import { route } from "@/lib/api";
import { decrypt } from "@/lib/crypto";
import { handleIncoming } from "@/lib/whatsapp/bot";
import { getWhatsApp, normPhone } from "@/lib/whatsapp/adapter";
import { Institution, Notification, Student, User } from "@/models";

export const dynamic = "force-dynamic";

const EMPLOYER = "919800000001";

/** GET — personas and the recent WhatsApp traffic (mock or live) for the simulator panel */
export const GET = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] } }, async ({ query }) => {
  const demoStudent = await User.findOne({ email: "student@demo" }, { studentApaar: 1, name: 1 }).lean();
  const s = demoStudent?.studentApaar ? await Student.findOne({ apaarId: demoStudent.studentApaar }, { phone: 1, institutionId: 1 }).lean() : null;
  const inst = s ? await Institution.findById(s.institutionId, { contactPhone: 1, name: 1 }).lean() : null;
  const breachInst = await Institution.findOne({ aicteId: "AICTE-MH-0003" }, { contactPhone: 1, name: 1 }).lean();
  const personas = [
    { id: "employer", label: "Employer (HR, Infosys demo)", phone: EMPLOYER },
    ...(s?.phone ? [{ id: "student", label: `Student (${demoStudent!.name})`, phone: normPhone(decrypt(s.phone)!) }] : []),
    ...(inst?.contactPhone ? [{ id: "institution", label: `Institution (${inst.name})`, phone: normPhone(inst.contactPhone) }] : []),
    ...(breachInst?.contactPhone ? [{ id: "institution2", label: `Institution (${breachInst.name})`, phone: normPhone(breachInst.contactPhone) }] : []),
  ];
  const phone = query.get("phone");
  const match = phone ? { $or: [{ to: { $in: [phone, phone.slice(2)] } }, { from: phone }] } : {};
  const messages = await Notification.find({ channel: "whatsapp", ...match }).sort({ createdAt: -1 }).limit(60).lean();
  return { mode: getWhatsApp().mode, personas, messages: messages.reverse() };
});

const Body = z.object({ from: z.string().regex(/^\d{10,13}$/), text: z.string().min(1).max(500) });

/** POST — simulate an incoming WhatsApp message from a persona (runs the real bot logic) */
export const POST = route({ roles: ["AICTE_ADMIN"], perms: { AICTE_ADMIN: ["full", "regional"] }, body: Body, rate: { name: "wa-sim", limit: 40, windowSec: 60 } }, async ({ body }) => {
  const replies = await handleIncoming(body.from, body.text);
  return { ok: true, replies };
});

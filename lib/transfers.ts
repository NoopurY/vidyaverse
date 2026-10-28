/** Transfer / migration workflow: request → release (old institution) → complete (new institution). */
import { decrypt } from "./crypto";
import { getWhatsApp } from "./whatsapp/adapter";
import { enrolStudent, updateStudent } from "./students";
import { loadInstitution } from "./intake";
import { Institution, Student, type TransferDoc } from "@/models";
import type { Actor } from "./api";

const MSG: Record<string, string> = {
  requested: "A transfer request has been raised for",
  released: "The current institution has released",
  completed: "Transfer completed for",
  rejected: "Transfer request rejected for",
};

export async function notifyTransfer(t: TransferDoc, step: keyof typeof MSG) {
  const wa = getWhatsApp();
  const [from, to] = await Promise.all([
    Institution.findById(t.fromInstitutionId, { contactPhone: 1, name: 1 }).lean(),
    Institution.findById(t.toInstitutionId, { contactPhone: 1, name: 1 }).lean(),
  ]);
  const student = await Student.findOne({ apaarId: t.apaarId }, { phone: 1 }).lean();
  const text = `🔁 ${MSG[step]} ${t.studentName} (APAAR ${t.apaarId.slice(0, 2)}XXXXXX${t.apaarId.slice(-4)}).`;
  const tasks = [];
  if (from?.contactPhone) tasks.push(wa.send(from.contactPhone, `${text} Outgoing transfer – please review in VidyaVerse.`));
  if (to?.contactPhone) tasks.push(wa.send(to.contactPhone, `${text} Incoming transfer to ${to.name}.`));
  const sp = decrypt(student?.phone);
  if (sp) tasks.push(wa.send(sp, `${text} Destination: ${to?.name}. Status: ${step}.`));
  await Promise.all(tasks);
}

/** Old institution releases: student set to transferred and the seat token released */
export async function releaseTransfer(t: TransferDoc, actor: Actor, ip?: string) {
  const s = await Student.findOne({ apaarId: t.apaarId, institutionId: t.fromInstitutionId, status: "active" });
  if (!s) throw new Error("Active enrolment not found at the releasing institution");
  await updateStudent(s, { status: "transferred" }, actor, ip);
}

/** New institution completes: a fresh record is enrolled and consumes its own seat token */
export async function completeTransfer(t: TransferDoc, actor: Actor, ip?: string) {
  const old = await Student.findOne({ apaarId: t.apaarId, institutionId: t.fromInstitutionId });
  if (!old) throw new Error("Source record not found");
  const inst = await loadInstitution(String(t.toInstitutionId));
  const nat = old.nationalityStatus ?? "Indian";
  const r = await enrolStudent(
    {
      apaarId: old.apaarId,
      institutionStudentId: "",
      name: old.name,
      dob: old.dob,
      gender: old.gender ?? "",
      parentName: decrypt(old.parentName) ?? "",
      phone: decrypt(old.phone) ?? "",
      email: decrypt(old.email) ?? "",
      category: old.category ?? "General",
      nri: nat === "NRI" ? "Y" : "N",
      oci: nat === "OCI" ? "Y" : "N",
      foreignNational: nat === "FN" ? "Y" : "N",
      seatType: old.seatType ?? "regular",
      programId: t.toProgramId ?? "",
      academicYear: t.academicYear ?? old.academicYear,
      admissionDate: new Date().toISOString().slice(0, 10),
      counsellingRef: old.counsellingRef ?? "",
      status: "active",
    },
    inst,
    actor,
    { ip }
  );
  if (!r.ok) throw new Error(r.message);
  return r.student;
}

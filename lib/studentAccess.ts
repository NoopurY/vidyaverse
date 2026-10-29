/** Resolves the student record a caller may act on for credential / certificate endpoints. */
import { ApiError, institutionScope, type Actor } from "./api";
import { Institution, Student } from "@/models";

export async function studentForActor(actor: Actor, apaar: string) {
  if (!/^\d{12}$/.test(apaar)) throw new ApiError(400, "APAAR must be 12 digits");
  if (actor.role === "STUDENT") {
    if (actor.studentApaar !== apaar) throw new ApiError(403, "Students can only access their own record");
    const s =
      (await Student.findOne({ apaarId: apaar, status: { $in: ["active", "graduated"] } }).sort({ updatedAt: -1 })) ??
      (await Student.findOne({ apaarId: apaar }).sort({ updatedAt: -1 }));
    if (!s) throw new ApiError(404, "Record not found");
    return s;
  }
  if (actor.role === "AICTE_ADMIN" && actor.permission === "readonly") throw new ApiError(403, "Read-only access cannot open student records");
  const instIds = (await Institution.find(institutionScope(actor), { _id: 1 }).lean()).map((i) => i._id);
  const s = await Student.findOne({ apaarId: apaar, institutionId: { $in: instIds } }).sort({ status: 1, updatedAt: -1 });
  if (!s) throw new ApiError(404, "Student not found in your scope");
  return s;
}

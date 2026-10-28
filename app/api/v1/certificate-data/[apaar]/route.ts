import { NextRequest } from "next/server";
import { route, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { certificatePdf } from "@/lib/pdf";
import { qrPresentation, subjectClaims } from "@/lib/vc/issue";
import { Student } from "@/models";

async function load(actor: { institutionId?: string; isDegreeAwarding?: boolean }, apaar: string) {
  if (!actor.isDegreeAwarding) throw new ApiError(403, "Only degree-awarding institutions can fetch certificate data");
  if (!/^\d{12}$/.test(apaar)) throw new ApiError(400, "APAAR must be 12 digits");
  const s = await Student.findOne({ apaarId: apaar, institutionId: actor.institutionId });
  if (!s) throw new ApiError(404, "Student not found at your institution");
  return s;
}

const handler = route({ roles: ["INSTITUTION"] }, async ({ actor, params, query, ip }) => {
  const s = await load(actor, params.apaar);
  const { token, credentialId } = await qrPresentation(s);
  const verifyUrl = `${env.appUrl}/verify#vc=${token}`;
  await audit({ actor: actor.email, role: actor.role, action: "certificate.data_read", entity: "Student", entityId: String(s._id), ip });
  if (query.get("format") === "pdf") {
    const c = await subjectClaims(s);
    const bytes = await certificatePdf({ studentName: s.name, apaarId: s.apaarId, studentId: s.institutionStudentId ?? "—", program: c.program, institution: c.institution, year: s.academicYear, qrText: verifyUrl });
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="certificate-preview-${s.apaarId}.pdf"` } });
  }
  return { apaarId: s.apaarId, institutionStudentId: s.institutionStudentId, name: s.name, credentialId, qrVerificationToken: token, verifyUrl };
});

/** GET /api/v1/certificate-data/:apaar[?format=pdf] — APAAR + institution student ID + QR verification token */
export const GET = (req: NextRequest, ctx: { params: Record<string, string> }) => handler(req, ctx);

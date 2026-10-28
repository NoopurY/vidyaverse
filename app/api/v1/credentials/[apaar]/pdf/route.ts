import { route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { signedRecordPdf } from "@/lib/pdf";
import { currentCredential, qrPresentation, subjectClaims } from "@/lib/vc/issue";
import { issuerDid } from "@/lib/vc/keys";
import { studentForActor } from "@/lib/studentAccess";

export const dynamic = "force-dynamic";

/** GET /api/v1/credentials/:apaar/pdf — signed PDF record with QR (SD-JWT presentation) and signature */
export const GET = route({ roles: ["AICTE_ADMIN", "INSTITUTION", "STUDENT"] }, async ({ actor, params, ip }) => {
  const s = await studentForActor(actor, params.apaar);
  const cred = await currentCredential(s);
  const claims = await subjectClaims(s);
  const { token } = await qrPresentation(s);
  const bytes = await signedRecordPdf({
    fields: [
      ["Name", claims.name],
      ["APAAR ID", claims.apaarId],
      ["Date of birth", claims.dob],
      ["Institution", claims.institution],
      ["Program", claims.program],
      ["Academic year", claims.academicYear],
      ["Status", claims.status],
      ["Outcome", claims.outcome],
    ],
    qrText: `${env.appUrl}/verify#vc=${token}`,
    credentialId: cred.credentialId,
    issuer: issuerDid(),
    issuedAt: cred.issuedAt!.toISOString(),
    signature: cred.vcJwt!.split(".")[2],
  });
  await audit({ actor: actor.email, role: actor.role, action: "credential.pdf_download", entity: "Credential", entityId: cred.credentialId, ip });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="aicte-record-${s.apaarId}.pdf"`, "Cache-Control": "no-store" },
  });
});

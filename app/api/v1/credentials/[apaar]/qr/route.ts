import QRCode from "qrcode";
import { route } from "@/lib/api";
import { env } from "@/lib/env";
import { qrPresentation } from "@/lib/vc/issue";
import { studentForActor } from "@/lib/studentAccess";

/** GET /api/v1/credentials/:apaar/qr — QR (data URL) encoding the SD-JWT presentation for the digital ID card */
export const GET = route({ roles: ["STUDENT", "INSTITUTION", "AICTE_ADMIN"] }, async ({ actor, params }) => {
  const s = await studentForActor(actor, params.apaar);
  const { token, credentialId } = await qrPresentation(s);
  const url = `${env.appUrl}/verify#vc=${token}`;
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "L", margin: 1, width: 320 });
  return { credentialId, qr, url, token };
});

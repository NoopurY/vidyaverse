import { didDocument } from "@/lib/vc/keys";

export const dynamic = "force-dynamic"; // needs the signing key, which is only present at runtime

/** did:web document for the issuer (AICTE) with the Ed25519 public key */
export function GET() {
  return Response.json(didDocument(), { headers: { "Cache-Control": "public, max-age=3600" } });
}

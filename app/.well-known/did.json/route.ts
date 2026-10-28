import { didDocument } from "@/lib/vc/keys";

/** did:web document for the issuer (AICTE) with the Ed25519 public key */
export function GET() {
  return Response.json(didDocument(), { headers: { "Cache-Control": "public, max-age=3600" } });
}

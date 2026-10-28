import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { statusListCredentialJwt } from "@/lib/vc/statuslist";

export const dynamic = "force-dynamic";

/** GET /api/status-list/:id — BitstringStatusListCredential (vc+jwt), cacheable for 60s */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[\w-]{1,20}$/.test(params.id)) return new Response("Not found", { status: 404 });
  await dbConnect();
  const jwt = await statusListCredentialJwt(params.id);
  return new Response(jwt, { headers: { "Content-Type": "application/vc+jwt", "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" } });
}

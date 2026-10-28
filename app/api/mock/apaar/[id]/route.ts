import { publicRoute, ApiError } from "@/lib/api";
import { apaarConnector } from "@/lib/apaar";

export const dynamic = "force-dynamic";

/** GET /api/mock/apaar/:id — mock APAAR/DigiLocker registry lookup (name masked, DOB year only) */
export const GET = publicRoute({ rate: { name: "mock-apaar", limit: 30, windowSec: 60 } }, async ({ params }) => {
  if (!/^\d{12}$/.test(params.id)) throw new ApiError(400, "APAAR ID must be 12 digits");
  const r = await apaarConnector.lookup(params.id);
  if (!r) throw new ApiError(404, "APAAR ID not found");
  return { apaarId: r.apaarId, exists: true, status: r.status, nameInitials: r.name.split(" ").map((w) => w[0]).join(""), birthYear: r.dob.slice(0, 4), source: "MOCK-DigiLocker" };
});

import { dbConnect } from "@/lib/db";
import { User } from "@/models";

export const dynamic = "force-dynamic";

/** GET /api/health — database reachability and whether demo data is present (no secrets, no PII) */
export async function GET() {
  const demo = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
  try {
    await Promise.race([dbConnect(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000))]);
    const seeded = (await User.estimatedDocumentCount()) > 0;
    return Response.json({ ok: seeded, db: true, seeded, demo });
  } catch {
    return Response.json({ ok: false, db: false, seeded: false, demo, message: "Database not reachable" }, { status: 503 });
  }
}
